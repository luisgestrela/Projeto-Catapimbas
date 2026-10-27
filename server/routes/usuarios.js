import { Router } from "express";
import { auditar } from "../auditoria.js";
import { exigeInstituicao, exigePermissao, gerarHash, papelValido } from "../auth.js";
import { ErroHttp, consultar, supabase } from "../supabase.js";
import { EMAIL, PAPEIS, inteiro, invalido, opcao, texto } from "../validar.js";

const r = Router();
r.use(exigeInstituicao, exigePermissao("usuario:aprovar", "usuario:permissao"));

const nomeDe = async (id) => (await consultar(supabase.from("usuario").select("nome").eq("id", id).maybeSingle()))?.nome ?? "—";
const normalizarEmail = (email) => String(email || "").trim().toLowerCase();

const vinculoDe = async (req, usuarioId, situacoes) => {
  const v = await consultar(
    supabase.from("vinculo_institucional").select("id, situacao, papel").eq("instituicao_id", req.instituicaoId).eq("usuario_id", usuarioId).maybeSingle(),
  );
  if (!v || (situacoes && !situacoes.includes(v.situacao))) throw new ErroHttp(404, "Vínculo não encontrado.");
  return v;
};

const naoProprio = (req, usuarioId) => {
  if (usuarioId === req.usuario.id) throw new ErroHttp(400, "Você não pode alterar o seu próprio acesso.");
};

const atualizar = (req, id, campos) =>
  consultar(supabase.from("vinculo_institucional").update(campos).eq("id", id).eq("instituicao_id", req.instituicaoId));

r.post("/", async (req, res) => {
  const nome = texto(req.body?.nome, "nome", { min: 2, max: 120 });
  const email = normalizarEmail(req.body?.email);
  if (!EMAIL.test(email) || email.length > 160) throw invalido("E-mail inválido.", { email: "E-mail inválido." });
  const senha = String(req.body?.senha || "");
  if (senha.length < 8 || senha.length > 72) throw invalido("A senha deve ter entre 8 e 72 caracteres.", { senha: "Use entre 8 e 72 caracteres." });

  let usuario = await consultar(supabase.from("usuario").select("id, status, superadmin").eq("email", email).maybeSingle());
  if (usuario?.superadmin) throw new ErroHttp(409, "Este e-mail pertence a um superadministrador.");
  if (!usuario) {
    usuario = await consultar(supabase.from("usuario").insert({ nome, email, hash_senha: await gerarHash(senha) }).select("id, status, superadmin").single());
  } else {
    await consultar(supabase.from("usuario").update({ nome, hash_senha: await gerarHash(senha), status: "ativo" }).eq("id", usuario.id));
  }

  const papel = await papelValido(opcao("avaliador", "papel", PAPEIS));
  const existente = await consultar(
    supabase.from("vinculo_institucional").select("id, situacao").eq("instituicao_id", req.instituicaoId).eq("usuario_id", usuario.id).maybeSingle(),
  );
  if (existente && ["ativo", "bloqueado", "pendente"].includes(existente.situacao)) {
    throw new ErroHttp(409, "Este e-mail já possui vínculo com a instituição.");
  }
  const campos = { papel, situacao: "ativo", justificativa: null, decidido_em: new Date().toISOString(), decidido_por: req.usuario.id, solicitado_em: new Date().toISOString() };
  if (existente) await atualizar(req, existente.id, campos);
  else await consultar(supabase.from("vinculo_institucional").insert({ ...campos, instituicao_id: req.instituicaoId, usuario_id: usuario.id }));
  await auditar(req, req.instituicaoId, "aprovacao", nome, "Cadastrado diretamente como avaliador");
  res.status(201).json({ id: usuario.id });
});

r.post("/:usuarioId/aprovar", async (req, res) => {
  const usuarioId = inteiro(req.params.usuarioId, "usuarioId");
  const v = await vinculoDe(req, usuarioId, ["pendente"]);
  await atualizar(req, v.id, { situacao: "ativo", justificativa: null, decidido_em: new Date().toISOString(), decidido_por: req.usuario.id });
  await auditar(req, req.instituicaoId, "aprovacao", await nomeDe(usuarioId), `Aprovado como ${v.papel}`);
  res.json({ ok: true });
});

r.post("/:usuarioId/recusar", async (req, res) => {
  const usuarioId = inteiro(req.params.usuarioId, "usuarioId");
  const justificativa = texto(req.body?.justificativa, "justificativa", { min: 3, max: 500 });
  const v = await vinculoDe(req, usuarioId, ["pendente"]);
  await atualizar(req, v.id, { situacao: "recusado", justificativa, decidido_em: new Date().toISOString(), decidido_por: req.usuario.id });
  await auditar(req, req.instituicaoId, "aprovacao", await nomeDe(usuarioId), `Recusado: ${justificativa}`);
  res.json({ ok: true });
});

r.patch("/:usuarioId/papel", async (req, res) => {
  const usuarioId = inteiro(req.params.usuarioId, "usuarioId");
  naoProprio(req, usuarioId);
  const novo = opcao(req.body?.papel, "papel", PAPEIS);
  const v = await vinculoDe(req, usuarioId, ["ativo", "bloqueado"]);
  await atualizar(req, v.id, { papel: await papelValido(novo) });
  await auditar(req, req.instituicaoId, "permissao", await nomeDe(usuarioId), `Papel de ${v.papel} para ${novo}`);
  res.json({ ok: true });
});

r.patch("/:usuarioId/bloqueio", async (req, res) => {
  const usuarioId = inteiro(req.params.usuarioId, "usuarioId");
  naoProprio(req, usuarioId);
  if (typeof req.body?.bloquear !== "boolean") throw invalido("Valor inválido.");
  const v = await vinculoDe(req, usuarioId, ["ativo", "bloqueado"]);
  await atualizar(req, v.id, { situacao: req.body.bloquear ? "bloqueado" : "ativo" });
  await auditar(req, req.instituicaoId, "permissao", await nomeDe(usuarioId), req.body.bloquear ? "Acesso bloqueado" : "Acesso desbloqueado");
  res.json({ ok: true });
});

r.delete("/:usuarioId/vinculo", async (req, res) => {
  const usuarioId = inteiro(req.params.usuarioId, "usuarioId");
  naoProprio(req, usuarioId);
  const v = await vinculoDe(req, usuarioId, ["ativo", "bloqueado"]);
  await atualizar(req, v.id, { situacao: "revogado" });
  await auditar(req, req.instituicaoId, "permissao", await nomeDe(usuarioId), "Acesso à instituição revogado");
  res.json({ ok: true });
});

export default r;
