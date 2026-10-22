import { Router } from "express";
import { exigeInstituicao, exigePermissao, temPermissao } from "../auth.js";
import { gerarXlsx } from "../../src/utils/xlsx.js";
import { projetosDoPerfil } from "../estado.js";
import { dadosDaBanca } from "../ranking.js";
import { ErroHttp, consultar, rpc, supabase } from "../supabase.js";
import { inteiro, invalido, listaIds, texto } from "../validar.js";

const r = Router();
r.use(exigeInstituicao);

const DATA = /^\d{4}-\d{2}-\d{2}$/;

function dadosBanca(b = {}) {
  if (!DATA.test(b.inicio || "") || !DATA.test(b.fim || "")) throw invalido("Período inválido.");
  const pesos = {};
  for (const [k, v] of Object.entries(b.pesos && typeof b.pesos === "object" ? b.pesos : {})) {
    const n = Number(v);
    if (Number.isInteger(Number(k)) && Number.isFinite(n) && n > 0 && n <= 9999) pesos[k] = n;
  }
  return {
    nome: texto(b.nome, "nome", { min: 2, max: 160 }), inicio: b.inicio, fim: b.fim, instrumentoId: inteiro(b.instrumentoId, "instrumentoId"),
    projetosIds: listaIds(b.projetosIds, "projetosIds"), avaliadoresIds: listaIds(b.avaliadoresIds, "avaliadoresIds"), pesos,
  };
}

r.post("/", exigePermissao("banca:gerir"), async (req, res) => {
  const id = await rpc("salvar_banca", { p_inst: req.instituicaoId, p_id: null, p_dados: dadosBanca(req.body), p_ator: req.usuario.id });
  res.status(201).json({ id });
});

r.put("/:id", exigePermissao("banca:gerir"), async (req, res) => {
  const id = inteiro(req.params.id, "id");
  await rpc("salvar_banca", { p_inst: req.instituicaoId, p_id: id, p_dados: dadosBanca(req.body), p_ator: req.usuario.id });
  res.json({ id });
});

// Designa ou remove avaliadores (inclusive com a banca em andamento). Quem já lançou notas não pode ser removido.
r.put("/:id/avaliadores", exigePermissao("banca:gerir"), async (req, res) => {
  const id = inteiro(req.params.id, "id");
  await rpc("designar_avaliadores", { p_inst: req.instituicaoId, p_banca: id, p_avaliadores: listaIds(req.body?.avaliadoresIds, "avaliadoresIds"), p_ator: req.usuario.id });
  res.json({ id });
});

async function carregarVisivel(req) {
  const id = inteiro(req.params.id, "id");
  const dados = await dadosDaBanca(req.instituicaoId, id);
  if (!dados) throw new ErroHttp(404, "Registro não encontrado.");
  const gerente = temPermissao(req.papel, "resultado:ver_rascunho");
  if (gerente) return { ...dados, gerente };
  if (!temPermissao(req.papel, "resultado:ver") || dados.banca.resultado !== "publicado") throw new ErroHttp(404, "Registro não encontrado.");
  const proprios = (await projetosDoPerfil(req)).map((p) => p.id);
  if (!dados.bancaDb.projetosIds.some((p) => proprios.includes(p))) throw new ErroHttp(404, "Registro não encontrado.");
  return { ...dados, gerente };
}

r.get("/:id/ranking", async (req, res) => {
  const { ranking } = await carregarVisivel(req);
  res.json(ranking);
});

r.get("/:id/exportacao", exigePermissao("relatorio:exportar"), async (req, res) => {
  const { banca, bancaDb, db, ranking, gerente, nomePorUsuario } = await carregarVisivel(req);
  const nomeProjeto = new Map(db.projetos.map((p) => [p.id, p.nome]));
  const notas = db.avaliacoes.flatMap((a) => a.criterios.map((c) => ({
    projeto: nomeProjeto.get(a.projetoId),
    avaliador: gerente ? nomePorUsuario.get(a.avaliadorId) : `Avaliador ${bancaDb.avaliadoresIds.indexOf(a.avaliadorId) + 1}`,
    criterio: c.titulo, peso: c.peso, nota: a.notas[c.id],
  })));
  const blob = gerarXlsx([
    { nome: "Ranking", linhas: [
      ["Posição", "Projeto", "Pontuação", "Avaliações válidas", "Empate"],
      ...ranking.map((l) => [`${l.posicao}º`, l.projeto, Number(l.pontuacao.toFixed(2)), l.avaliacoes, l.empatado ? "Sim" : "Não"]),
    ] },
    { nome: "Notas", linhas: [["Projeto", "Avaliador", "Critério", "Peso", "Nota"], ...notas.map((n) => [n.projeto, n.avaliador, n.criterio, n.peso, n.nota])] },
  ]);
  const arquivo = `resultados-${banca.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  res.setHeader("Content-Type", blob.type);
  res.setHeader("Content-Disposition", `attachment; filename="${arquivo}"`);
  res.send(Buffer.from(await blob.arrayBuffer()));
});

r.post("/:id/publicar", exigePermissao("banca:publicar"), async (req, res) => {
  const id = inteiro(req.params.id, "id");
  const dados = await dadosDaBanca(req.instituicaoId, id);
  if (!dados) throw new ErroHttp(404, "Registro não encontrado.");
  const linhas = dados.ranking.map((l) => ({
    projeto_id: l.projetoId, pontuacao: l.pontuacao, desempate: l.desempate, posicao: l.posicao, empatado: l.empatado, avaliacoes: l.avaliacoes,
  }));
  await rpc("publicar_resultado", { p_inst: req.instituicaoId, p_banca: id, p_ator: req.usuario.id, p_linhas: linhas });
  res.json({ ok: true });
});

r.post("/:id/avaliacoes", exigePermissao("nota:lancar"), async (req, res) => {
  const bancaId = inteiro(req.params.id, "id");
  const projetoId = inteiro(req.body?.projetoId, "projetoId");
  const notas = {};
  for (const [k, v] of Object.entries(req.body?.notas && typeof req.body.notas === "object" ? req.body.notas : {})) {
    if (Number.isInteger(Number(k)) && Number.isInteger(Number(v))) notas[k] = Number(v);
  }
  const id = await rpc("enviar_avaliacao", { p_inst: req.instituicaoId, p_banca: bancaId, p_projeto: projetoId, p_usuario: req.usuario.id, p_notas: notas });
  const av = await consultar(supabase.from("avaliacao").select("id, protocolo").eq("id", id).single());
  res.status(201).json(av);
});

export default r;
