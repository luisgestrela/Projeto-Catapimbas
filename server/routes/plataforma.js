import { Router } from "express";
import { auditar } from "../auditoria.js";
import { exigeSuperadmin, gerarHash, papelValido } from "../auth.js";
import { formatarDia } from "../estado.js";
import { ErroHttp, consultar, supabase } from "../supabase.js";
import { EMAIL, inteiro, invalido, texto } from "../validar.js";

// Visão e gestão entre instituições. Somente superadmin; não depende de uma instituição selecionada.
// As consultas evitam "embeds" do PostgREST: nomes de usuários e instituições são juntados aqui, o que
// torna as telas imunes a ambiguidade de relacionamentos (vinculo_institucional tem duas FKs para usuario).
const r = Router();
r.use(exigeSuperadmin);

const COLUNAS = "id, instituicao_id, usuario_id, papel, situacao, justificativa, solicitado_em";

async function mapear(linhas) {
  const usuarioIds = [...new Set(linhas.map((v) => v.usuario_id))];
  const instIds = [...new Set(linhas.map((v) => v.instituicao_id))];
  const [usuarios, instituicoes] = await Promise.all([
    usuarioIds.length ? consultar(supabase.from("usuario").select("id, nome, email").in("id", usuarioIds)) : [],
    instIds.length ? consultar(supabase.from("instituicao").select("id, nome").in("id", instIds)) : [],
  ]);
  const usuarioPorId = new Map(usuarios.map((u) => [u.id, u]));
  const instPorId = new Map(instituicoes.map((i) => [i.id, i]));
  return linhas.map((v) => ({
    id: v.id, usuarioId: v.usuario_id, nome: usuarioPorId.get(v.usuario_id)?.nome ?? "—", email: usuarioPorId.get(v.usuario_id)?.email ?? "",
    instituicaoId: v.instituicao_id, instituicao: instPorId.get(v.instituicao_id)?.nome ?? "—",
    papel: v.papel, situacao: v.situacao, justificativa: v.justificativa || undefined, data: formatarDia(v.solicitado_em),
  }));
}

const buscarVinculo = async (id) => {
  const v = await consultar(supabase.from("vinculo_institucional").select(COLUNAS).eq("id", id).maybeSingle());
  if (!v) throw new ErroHttp(404, "Vínculo não encontrado.");
  return (await mapear([v]))[0];
};

// Solicitações de ingresso de todas as instituições (pendentes e recusadas).
r.get("/solicitacoes", async (_req, res) => {
  const linhas = await consultar(
    supabase.from("vinculo_institucional").select(COLUNAS).in("situacao", ["pendente", "recusado"]).order("solicitado_em", { ascending: false }).limit(2000),
  );
  res.json(await mapear(linhas));
});

async function decidir(req, res, situacao, justificativa) {
  const v = await buscarVinculo(inteiro(req.params.vinculoId, "vinculoId"));
  const permitidas = situacao === "ativo" ? ["pendente", "recusado"] : ["pendente"];
  if (!permitidas.includes(v.situacao)) throw new ErroHttp(409, "Esta solicitação não está mais pendente.");
  await consultar(
    supabase.from("vinculo_institucional")
      .update({ situacao, justificativa, decidido_em: new Date().toISOString(), decidido_por: req.usuario.id })
      .eq("id", v.id).in("situacao", permitidas),
  );
  const detalhe = situacao === "ativo" ? `Aprovado como ${v.papel} (superadmin)` : `Recusado (superadmin): ${justificativa}`;
  await auditar(req, v.instituicaoId, "aprovacao", v.nome, detalhe);
  res.json({ ok: true });
}

r.post("/solicitacoes/:vinculoId/aprovar", (req, res) => decidir(req, res, "ativo", null));
r.post("/solicitacoes/:vinculoId/recusar", (req, res) =>
  decidir(req, res, "recusado", texto(req.body?.justificativa, "justificativa", { min: 3, max: 500 })));

// Administradores de cada instituição.
r.get("/administradores", async (_req, res) => {
  const linhas = await consultar(
    supabase.from("vinculo_institucional").select(COLUNAS).eq("papel", "administrador").in("situacao", ["ativo", "bloqueado"]).order("instituicao_id"),
  );
  res.json(await mapear(linhas));
});

// Usuários que podem ser escolhidos como administrador (lista para o seletor da tela).
r.get("/usuarios", async (_req, res) => {
  const linhas = await consultar(
    supabase.from("usuario").select("id, nome, email, status, anonimizado_em").order("nome").limit(2000),
  );
  res.json(linhas.filter((u) => !u.anonimizado_em && u.status === "ativo").map((u) => ({ id: u.id, nome: u.nome, email: u.email })));
});

// Define um usuário como administrador de uma instituição. Aceita um usuário existente (usuarioId ou email)
// ou cria a conta na hora quando são informados nome, e-mail e senha provisória.
r.post("/instituicoes/:id/administradores", async (req, res) => {
  const instituicaoId = inteiro(req.params.id, "id");
  const b = req.body || {};
  const inst = await consultar(supabase.from("instituicao").select("id, nome").eq("id", instituicaoId).maybeSingle());
  if (!inst) throw new ErroHttp(404, "Instituição não encontrada.");

  let usuario = null;
  if (b.usuarioId) {
    usuario = await consultar(supabase.from("usuario").select("id, nome, status, anonimizado_em").eq("id", inteiro(b.usuarioId, "usuarioId")).maybeSingle());
  } else {
    const email = String(b.email || "").trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 160) throw invalido("E-mail inválido.", { email: "E-mail inválido." });
    usuario = await consultar(supabase.from("usuario").select("id, nome, status, anonimizado_em").eq("email", email).maybeSingle());
    if (!usuario) {
      // Conta nova: exige nome e senha provisória.
      const nome = texto(b.nome, "nome", { min: 2, max: 120 });
      const senha = String(b.senha || "");
      if (senha.length < 8 || senha.length > 72) throw invalido("A senha provisória deve ter entre 8 e 72 caracteres.", { senha: "Use de 8 a 72 caracteres." });
      usuario = await consultar(supabase.from("usuario").insert({ nome, email, hash_senha: await gerarHash(senha) }).select("id, nome, status, anonimizado_em").single());
    }
  }
  if (!usuario || usuario.anonimizado_em) throw new ErroHttp(404, "Usuário não encontrado.", { email: "Nenhum usuário cadastrado com este e-mail." });
  if (usuario.status !== "ativo") throw new ErroHttp(409, "A conta deste usuário está bloqueada.");

  const campos = { papel: await papelValido("administrador"), situacao: "ativo", justificativa: null, decidido_em: new Date().toISOString(), decidido_por: req.usuario.id };
  const atual = await consultar(
    supabase.from("vinculo_institucional").select("id, papel, situacao").eq("instituicao_id", instituicaoId).eq("usuario_id", usuario.id).maybeSingle(),
  );
  if (atual?.papel === "administrador" && atual.situacao === "ativo") throw new ErroHttp(409, "Este usuário já administra esta instituição.");
  if (atual) await consultar(supabase.from("vinculo_institucional").update(campos).eq("id", atual.id));
  else await consultar(supabase.from("vinculo_institucional").insert({ instituicao_id: instituicaoId, usuario_id: usuario.id, ...campos }));
  await auditar(req, instituicaoId, "permissao", usuario.nome, `Definido como administrador de ${inst.nome} (superadmin)`);
  res.status(201).json({ ok: true, usuarioId: usuario.id });
});

// Remove o acesso de administrador de uma instituição (o vínculo fica como "revogado" e o histórico é mantido).
r.delete("/administradores/:vinculoId", async (req, res) => {
  const v = await buscarVinculo(inteiro(req.params.vinculoId, "vinculoId"));
  if (v.papel !== "administrador" || !["ativo", "bloqueado"].includes(v.situacao)) throw new ErroHttp(404, "Administrador não encontrado.");
  await consultar(supabase.from("vinculo_institucional").update({ situacao: "revogado" }).eq("id", v.id));
  await auditar(req, v.instituicaoId, "permissao", v.nome, `Acesso de administrador revogado em ${v.instituicao} (superadmin)`);
  res.json({ ok: true });
});

export default r;
