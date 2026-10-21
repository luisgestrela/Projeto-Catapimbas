import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { abrirSessao, autenticar, conferirSenha, encerrarSessao, gerarHash, papelId } from "../auth.js";
import { config } from "../config.js";
import { ErroHttp, consultar, supabase } from "../supabase.js";
import { EMAIL, PAPEIS_SOLICITAVEIS, inteiro, invalido, opcao, texto } from "../validar.js";

const r = Router();
const HASH_FALSO = bcrypt.hashSync("senha-invalida", 12);
const tentativas = new Map();
const JANELA = 15 * 60 * 1000;
const LIMITE = 10;

const bloqueado = (chave) => {
  const agora = Date.now();
  const lista = (tentativas.get(chave) || []).filter((t) => agora - t < JANELA);
  tentativas.set(chave, lista);
  return lista.length >= LIMITE;
};
const falhou = (chave) => tentativas.set(chave, [...(tentativas.get(chave) || []), Date.now()]);

const hashToken = (token) => `\\x${crypto.createHash("sha256").update(token).digest("hex")}`;
const normalizar = (email) => String(email || "").trim().toLowerCase();

r.post("/login", async (req, res) => {
  const email = normalizar(req.body?.email);
  const senha = String(req.body?.senha || "");
  const chave = `${req.ip}|${email}`;
  if (bloqueado(chave)) throw new ErroHttp(429, "Muitas tentativas. Aguarde alguns minutos.");
  const u = EMAIL.test(email) ? await consultar(supabase.from("usuario").select("id, senha_hash, status, bloqueado_ate, anonimizado_em").eq("email", email).maybeSingle()) : null;
  const confere = await conferirSenha(senha, u?.senha_hash || HASH_FALSO);
  if (u?.bloqueado_ate && new Date(u.bloqueado_ate) > new Date()) throw new ErroHttp(429, "Conta temporariamente bloqueada. Tente mais tarde.");
  if (!u || !confere || u.status !== "ativo" || u.anonimizado_em) {
    falhou(chave);
    throw new ErroHttp(401, "E-mail ou senha incorretos.");
  }
  tentativas.delete(chave);
  await consultar(supabase.from("usuario").update({ ultimo_login_em: new Date().toISOString(), tentativas_login_falhas: 0 }).eq("id", u.id));
  abrirSessao(res, u.id);
  res.json({ ok: true });
});

r.post("/sair", (_req, res) => {
  encerrarSessao(res);
  res.json({ ok: true });
});

r.post("/cadastro", async (req, res) => {
  const nome = texto(req.body?.nome, "nome", { min: 2, max: 120 });
  const email = normalizar(req.body?.email);
  if (!EMAIL.test(email) || email.length > 160) throw invalido("E-mail inválido.", { email: "E-mail inválido." });
  const senha = String(req.body?.senha || "");
  if (senha.length < 8 || senha.length > 72) throw invalido("A senha deve ter entre 8 e 72 caracteres.");
  const instituicaoId = inteiro(req.body?.instituicaoId, "instituicaoId");
  const papel = opcao(req.body?.papel, "papel", PAPEIS_SOLICITAVEIS);

  const inst = await consultar(supabase.from("instituicao").select("id").eq("id", instituicaoId).eq("status", "ativa").maybeSingle());
  if (!inst) throw invalido("Instituição inválida.");

  let usuario = await consultar(supabase.from("usuario").select("id, senha_hash, status, bloqueado_ate, anonimizado_em").eq("email", email).maybeSingle());
  if (usuario) {
    if (!(await conferirSenha(senha, usuario.senha_hash)) || usuario.status !== "ativo") {
      throw new ErroHttp(409, "Este e-mail já está cadastrado. Informe a senha atual da conta para solicitar o vínculo.");
    }
  } else {
    usuario = await consultar(supabase.from("usuario").insert({ nome, email, senha_hash: await gerarHash(senha) }).select("id").single());
  }

  const papelIdSolicitado = await papelId(papel);
  const existente = await consultar(
    supabase.from("vinculo_institucional").select("id, situacao").eq("instituicao_id", instituicaoId).eq("usuario_id", usuario.id).maybeSingle(),
  );
  if (existente && !["recusado", "revogado"].includes(existente.situacao)) {
    throw new ErroHttp(409, "Este e-mail já tem vínculo com a instituição escolhida.");
  }
  if (existente) {
    await consultar(
      supabase.from("vinculo_institucional").update({ papel_id: papelIdSolicitado, situacao: "pendente", justificativa: null, solicitado_em: new Date().toISOString(), decidido_em: null, decidido_por: null }).eq("id", existente.id),
    );
  } else {
    await consultar(supabase.from("vinculo_institucional").insert({ instituicao_id: instituicaoId, usuario_id: usuario.id, papel_id: papelIdSolicitado }));
  }
  res.status(201).json({ ok: true });
});

r.post("/recuperar", async (req, res) => {
  const email = normalizar(req.body?.email);
  if (EMAIL.test(email)) {
    const u = await consultar(supabase.from("usuario").select("id, status").eq("email", email).maybeSingle());
    if (u && u.status === "ativo") {
      const token = crypto.randomBytes(32).toString("hex");
      await consultar(supabase.from("recuperacao_senha").insert({
        usuario_id: u.id, token_hash: hashToken(token), expira_em: new Date(Date.now() + 60 * 60 * 1000).toISOString(), ip: req.ip,
      }));
      if (!config.producao) console.log(`[dev] link de redefinição: ${config.origem}/redefinir-senha?token=${token}`);
    }
  }
  res.json({ ok: true });
});

r.post("/redefinir", async (req, res) => {
  const token = String(req.body?.token || "");
  const senha = String(req.body?.senha || "");
  if (senha.length < 8 || senha.length > 72) throw invalido("A senha deve ter entre 8 e 72 caracteres.");
  const reg = await consultar(supabase.from("recuperacao_senha").select("id, usuario_id, expira_em, usado_em").eq("token_hash", hashToken(token)).maybeSingle());
  if (!reg || reg.usado_em || new Date(reg.expira_em) < new Date()) throw invalido("Link inválido ou expirado.");
  await consultar(supabase.from("usuario").update({ senha_hash: await gerarHash(senha) }).eq("id", reg.usuario_id));
  await consultar(supabase.from("recuperacao_senha").update({ usado_em: new Date().toISOString() }).eq("usuario_id", reg.usuario_id).is("usado_em", null));
  res.json({ ok: true });
});

r.get("/sessao", autenticar, (req, res) => res.json({ id: req.usuario.id, nome: req.usuario.nome }));

export default r;
