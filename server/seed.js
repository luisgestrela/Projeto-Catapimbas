import { gerarHash, papelValido } from "./auth.js";
import { dadosDaBanca } from "./ranking.js";
import { consultar, rpc, supabase } from "./supabase.js";

const existente = await consultar(supabase.from("instituicao").select("id").eq("identificador", "ucsal").maybeSingle());
if (existente) {
  console.log("Dados de demonstração já existem. Nada foi alterado.");
  process.exit(0);
}

const iso = (dias) => new Date(Date.now() + dias * 864e5).toISOString().slice(0, 10);
const hash = await gerarHash("12345678");

const [ucsal, techba] = await consultar(supabase.from("instituicao").insert([
  { nome: "UCSAL", identificador: "ucsal", status: "ativa", cor_primaria: "#0f5e73" },
  { nome: "Incubadora Tech Bahia", identificador: "techba", status: "ativa", cor_primaria: "#14703f" },
]).select("id").order("id"));
const I = { 1: ucsal.id, 2: techba.id };

const v = (inst, papel, situacao = "ativo", justificativa = null) => ({ inst, papel, situacao, justificativa });
const PESSOAS = [
  ["Sofia Ribeiro", "super@demo.com", [], true],
  ["Ana Administradora", "admin@demo.com", [v(1, "administrador")]],
  ["Carlos Coordenador", "coord@demo.com", [v(1, "coordenador")]],
  ["Profa. Marina Lopes", "orientador@demo.com", [v(1, "orientador")]],
  ["Bruno Aluno", "aluno@demo.com", [v(1, "aluno")]],
  ["Paula Avaliadora", "avaliador@demo.com", [v(1, "avaliador"), v(2, "coordenador")]],
  ["Rafael Dantas", "rafael@demo.com", [v(1, "avaliador")]],
  ["Helena Souza", "helena@demo.com", [v(1, "avaliador")]],
  ["Diego Aluno", "diego@demo.com", [v(1, "aluno")]],
  ["Pedro Pendente", "pendente@demo.com", [v(1, "aluno", "pendente")]],
  ["Carla Mendes", "carla@demo.com", [v(1, "avaliador", "pendente")]],
  ["Rui Recusado", "recusado@demo.com", [v(1, "aluno", "recusado", "E-mail institucional não confere com o cadastro de alunos.")]],
  ["Prof. Henrique Dias", "henrique@demo.com", [v(1, "orientador")]],
];
const usuarios = await consultar(supabase.from("usuario").insert(
  PESSOAS.map(([nome, email, , superadmin]) => ({ nome, email, hash_senha: hash, superadmin: !!superadmin })),
).select("id, email"));
const U = {};
PESSOAS.forEach(([, email], i) => { U[i + 1] = usuarios.find((u) => u.email === email).id; });

for (const c of ["administrador", "coordenador", "orientador", "avaliador", "aluno"]) await papelValido(c);
await consultar(supabase.from("vinculo_institucional").insert(
  PESSOAS.flatMap(([, , vs], i) => vs.map((x) => ({
    instituicao_id: I[x.inst], usuario_id: U[i + 1], papel: x.papel, situacao: x.situacao, justificativa: x.justificativa,
    decidido_em: x.situacao === "ativo" ? new Date().toISOString() : null, decidido_por: x.situacao === "ativo" ? U[2] : null,
  }))),
));

const PROJETOS = [
  [1, "AcolheMãe", "Plataforma de acolhimento e acompanhamento de gestantes em situação de vulnerabilidade.", "ativo", 2026, "2", 4, "Time Acolher", [5, 9]],
  [1, "InovArt", "Marketplace para artesãos locais venderem para todo o país.", "ativo", 2026, "2", 4, "Artesãos Digitais", [9]],
  [1, "VANMO", "Aplicativo de mobilidade para transporte alternativo em bairros periféricos.", "ativo", 2026, "2", 4, "Rota Certa", [5]],
  [1, "HECO", "Gestão de resíduos eletrônicos com pontos de coleta parceiros.", "ativo", 2026, "1", 4, "Eco Tech", [5, 9]],
  [1, "SalvadorGO!", "Roteiros turísticos colaborativos por bairro.", "ativo", 2026, "1", 13, "Turismo Local", []],
  [1, "Ecoleta", "Logística reversa para pequenos comércios.", "arquivado", 2026, "1", 13, "Verde Cidade", []],
  [1, "TeraPet", "Telemedicina veterinária.", "arquivado", 2025, "2", 13, "Pet Care", []],
  [2, "NovaRota", "Otimização de entregas de última milha.", "ativo", 2026, "2", null, "Rota Nova", []],
];
const P = [];
for (const [inst, nome, descricao, status, ano, semestre, orientador, equipe, alunos] of PROJETOS) {
  P.push(await rpc("salvar_projeto", {
    p_inst: I[inst], p_id: null, p_ator: U[inst === 1 ? 2 : 6],
    p_dados: { nome, descricao, status, ano, semestre, equipe, orientadorId: orientador ? U[orientador] : null, alunosIds: alunos.map((a) => U[a]) },
  }));
}

const descritores = (t) => ({
  1: `${t}: ausente ou sem evidências.`, 2: `${t}: insuficiente, com lacunas importantes.`, 3: `${t}: atende ao básico esperado.`,
  4: `${t}: bem desenvolvido, com poucas lacunas.`, 5: `${t}: excelente e bem demonstrado.`,
});
const CRITERIOS = [
  ["Problema e oportunidade", 2, "Clareza do problema e tamanho da oportunidade."],
  ["Solução e inovação", 2, "Diferencial e viabilidade técnica da solução."],
  ["Mercado e modelo de negócio", 1.5, "Público, receita e canais."],
  ["Equipe", 1, "Complementaridade e dedicação da equipe."],
  ["Apresentação (pitch)", 1, "Clareza, tempo e domínio do tema."],
];
const criarInstrumento = async (inst, ator, nome, criterios) => {
  const { id } = await consultar(supabase.from("instrumento").insert({ instituicao_id: I[inst], nome, criado_por: ator }).select("id").single());
  for (const [titulo, peso, descricao] of criterios) {
    await rpc("salvar_criterio", {
      p_inst: I[inst], p_instrumento: id, p_versao_id: null, p_ator: ator,
      p_dados: { titulo, descricao, peso, escala: { min: 1, max: 5 }, descritores: descritores(titulo) },
    });
  }
  return id;
};
const inst1 = await criarInstrumento(1, U[2], "Instrumento padrão de startups", CRITERIOS);
await criarInstrumento(2, U[6], "Instrumento Incubadora", [["Potencial de mercado", 1, ""]]);

const banca1 = await rpc("salvar_banca", {
  p_inst: I[1], p_id: null, p_ator: U[2],
  p_dados: { nome: "Banca final 2026.2", inicio: iso(-7), fim: iso(60), instrumentoId: inst1, projetosIds: [P[0], P[1], P[2]], avaliadoresIds: [U[6], U[7], U[8]], pesos: {} },
});
const banca2 = await rpc("salvar_banca", {
  p_inst: I[1], p_id: null, p_ator: U[2],
  p_dados: { nome: "Banca parcial 2026.1", inicio: "2026-05-01", fim: "2026-06-30", instrumentoId: inst1, projetosIds: [P[3], P[4], P[5], P[6]], avaliadoresIds: [U[6], U[7], U[8]], pesos: {} },
});

const criteriosBanca = await consultar(supabase.from("banca_criterio").select("id, banca_id, criterio_versao_id, ordem").in("banca_id", [banca1, banca2]).order("ordem"));
const bps = await consultar(supabase.from("banca_projeto").select("id, banca_id, projeto_id").eq("banca_id", banca2));
const vincs = await consultar(supabase.from("vinculo_institucional").select("id, usuario_id").eq("instituicao_id", I[1]));
const bas = await consultar(supabase.from("banca_avaliador").select("id, vinculo_id").eq("banca_id", banca2));
const baDoUsuario = (uid) => bas.find((b) => b.vinculo_id === vincs.find((x) => x.usuario_id === uid).id).id;

const NOTAS = [
  [4, 6, [5, 4, 4, 5, 4]], [4, 7, [4, 4, 5, 4, 5]], [4, 8, [5, 5, 4, 4, 4]],
  [5, 6, [4, 3, 4, 4, 3]], [5, 7, [3, 4, 3, 4, 4]], [5, 8, [4, 4, 3, 3, 4]],
  [6, 6, [3, 3, 3, 4, 3]], [6, 7, [3, 2, 3, 3, 3]], [6, 8, [2, 3, 3, 3, 4]],
  [7, 6, [2, 2, 3, 2, 3]], [7, 7, [3, 2, 2, 3, 2]], [7, 8, [2, 3, 2, 2, 3]],
];
const bc2 = criteriosBanca.filter((c) => c.banca_id === banca2);
for (const [pf, uf, ns] of NOTAS) {
  const av = await consultar(supabase.from("avaliacao").insert({
    instituicao_id: I[1], banca_id: banca2, banca_projeto_id: bps.find((b) => b.projeto_id === P[pf - 1]).id,
    banca_avaliador_id: baDoUsuario(U[uf]), status: "enviada", enviada_em: "2026-06-30T21:00:00Z",
  }).select("id").single());
  await consultar(supabase.from("avaliacao_nota").insert(bc2.map((c, k) => ({ instituicao_id: I[1], avaliacao_id: av.id, banca_criterio_id: c.id, nota: ns[k] }))));
}

const bc1 = criteriosBanca.filter((c) => c.banca_id === banca1);
await rpc("enviar_avaliacao", {
  p_inst: I[1], p_banca: banca1, p_projeto: P[0], p_usuario: U[7],
  p_notas: Object.fromEntries(bc1.map((c, k) => [c.criterio_versao_id, [5, 4, 4, 5, 4][k]])),
});

const { ranking } = await dadosDaBanca(I[1], banca2);
await rpc("publicar_resultado", {
  p_inst: I[1], p_banca: banca2, p_ator: U[2],
  p_linhas: ranking.map((l) => ({ projeto_id: l.projetoId, pontuacao: l.pontuacao, desempate: l.desempate, posicao: l.posicao, empatado: l.empatado, avaliacoes: l.avaliacoes })),
});

console.log("Dados de demonstração criados. Senha de todas as contas: 12345678");
