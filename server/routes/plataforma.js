import { Router } from "express";
import { auditar } from "../auditoria.js";
import { exigeSuperadmin } from "../auth.js";
import { formatarDia } from "../estado.js";
import { ErroHttp, consultar, supabase } from "../supabase.js";
import { EMAIL, inteiro, invalido, texto } from "../validar.js";

// Visão e gestão entre instituições. Somente superadmin (não depende de uma instituição selecionada).
const r = Router();
r.use(exigeSuperadmin);

const COLUNAS = "id, instituicao_id, usuario_id, papel, situacao, justificativa, solicitado_em, usuario:usuario_id(nome, email), instituicao:instituicao_id(nome)";

const mapear = (v) => ({
  id: v.id, usuarioId: v.usuario_id, nome: v.usuario?.nome ?? "—", email: v.usuario?.email ?? "",
  instituicaoId: v.instituicao_id, instituicao: v.instituicao?.nome ?? "—",
  papel: v.papel, situacao: v.situacao, justificativa: v.justificativa || undefined, data: formatarDia(v.solicitado_em),
});

const buscarVinculo = async (id) => {
  const v = await consultar(supabase.from("vinculo_institucional").select(COLUNAS).eq("id", id).maybeSingle());
  if (!v) throw new ErroHttp(404, "Vínculo não encontrado.");
  return v;
};

// Solicitações de ingresso de todas as instituições (pendentes e recusadas).
r.get("/solicitacoes", async (_req, res) => {
  const linhas = await consultar(
    supabase.from("vinculo_institucional").select(COLUNAS).in("situacao", ["pendente", "recusado"]).order("solicitado_em", { ascending: false }).limit(2000),
  );
  res.json(linhas.map(mapear));
});

const decidir = async (req, res, situacao, justificativa) => {
  const v = await buscarVinculo(inteiro(req.params.vinculoId, "vinculoId"));
  if (v.situacao !== "pendente") throw new ErroHttp(409, "Esta solicitação não está mais pendente.");
  await consultar(
    supabase.from("vinculo_institucional")
      .update({ situacao, justificativa, decidido_em: new Date().toISOString(), decidido_por: req.usuario.id })
      .eq("id", v.id).eq("situacao", "pendente"),
  );
  const detalhe = situacao === "ativo" ? `Aprovado como ${v.papel} (superadmin)` : `Recusado (superadmin): ${justificativa}`;
  await auditar(req, v.instituicao_id, "aprovacao", v.usuario?.nome ?? null, detalhe);
  res.json({ ok: true });
};

r.post("/solicitacoes/:vinculoId/aprovar", (req, res) => decidir(req, res, "ativo", null));
r.post("/solicitacoes/:vinculoId/recusar", (req, res) =>
  decidir(req, res, "recusado", texto(req.body?.justificativa, "justificativa", { min: 3, max: 500 })));

// Administradores de cada instituição.
r.get("/administradores", async (_req, res) => {
  const linhas = await consultar(
    supabase.from("vinculo_institucional").select(COLUNAS).eq("papel", "administrador").in("situacao", ["ativo", "bloqueado"]).order("instituicao_id"),
  );
  res.json(linhas.map(mapear));
});

// Define um usuário existente (por e-mail) como administrador de uma instituição.
r.post("/instituicoes/:id/administradores", async (req, res) => {
  const instituicaoId = inteiro(req.params.id, "id");
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!EMAIL.test(email)) throw invalido("E-mail inválido.", { email: "E-mail inválido." });
  const inst = await consultar(supabase.from("instituicao").select("id, nome").eq("id", instituicaoId).maybeSingle());
  if (!inst) throw new ErroHttp(404, "Instituição não encontrada.");
  const usuario = await consultar(supabase.from("usuario").select("id, nome, status, anonimizado_em").eq("email", email).maybeSingle());
  if (!usuario || usuario.anonimizado_em) throw new ErroHttp(404, "Nenhum usuário cadastrado com este e-mail.", { email: "Nenhum usuário cadastrado com este e-mail." });
  if (usuario.status !== "ativo") throw new ErroHttp(409, "A conta deste usuário está bloqueada.");

  const agora = new Date().toISOString();
  const atual = await consultar(
    supabase.from("vinculo_institucional").select("id").eq("instituicao_id", instituicaoId).eq("usuario_id", usuario.id).maybeSingle(),
  );
  const campos = { papel: "administrador", situacao: "ativo", justificativa: null, decidido_em: agora, decidido_por: req.usuario.id };
  if (atual) await consultar(supabase.from("vinculo_institucional").update(campos).eq("id", atual.id));
  else await consultar(supabase.from("vinculo_institucional").insert({ instituicao_id: instituicaoId, usuario_id: usuario.id, ...campos }));
  await auditar(req, instituicaoId, "permissao", usuario.nome, `Definido como administrador de ${inst.nome} (superadmin)`);
  res.status(201).json({ ok: true });
});

// Remove o acesso de administrador de uma instituição (o vínculo fica como "revogado" e o histórico é mantido).
r.delete("/administradores/:vinculoId", async (req, res) => {
  const v = await buscarVinculo(inteiro(req.params.vinculoId, "vinculoId"));
  if (v.papel !== "administrador" || !["ativo", "bloqueado"].includes(v.situacao)) throw new ErroHttp(404, "Administrador não encontrado.");
  await consultar(supabase.from("vinculo_institucional").update({ situacao: "revogado" }).eq("id", v.id));
  await auditar(req, v.instituicao_id, "permissao", v.usuario?.nome ?? null, `Acesso de administrador revogado em ${v.instituicao?.nome ?? ""} (superadmin)`);
  res.json({ ok: true });
});

export default r;
