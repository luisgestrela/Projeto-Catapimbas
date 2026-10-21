import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { ErroHttp, consultar, supabase } from "./supabase.js";

export const COOKIE = "sid";
const DURACAO = 60 * 60 * 8;

export const gerarHash = (senha) => bcrypt.hash(senha, 12);
export const conferirSenha = (senha, hash) => bcrypt.compare(senha, hash);

export function abrirSessao(res, usuarioId) {
  const token = jwt.sign({ sub: String(usuarioId) }, config.jwtSecret, { expiresIn: DURACAO });
  res.cookie(COOKIE, token, { httpOnly: true, secure: config.producao, sameSite: "lax", maxAge: DURACAO * 1000, path: "/" });
}

export const encerrarSessao = (res) => res.clearCookie(COOKIE, { path: "/" });

let permissoesPorPapel = new Map();

export async function carregarPermissoes() {
  const linhas = await consultar(supabase.from("papel_permissao").select("papel_codigo, permissao_codigo").limit(5000));
  permissoesPorPapel = new Map();
  for (const l of linhas) {
    const papel = l.papel_codigo;
    const permissao = l.permissao_codigo;
    if (!papel || !permissao) continue;
    if (!permissoesPorPapel.has(papel)) permissoesPorPapel.set(papel, new Set());
    permissoesPorPapel.get(papel).add(permissao);
  }
  if (!permissoesPorPapel.size) console.warn("Aviso: papel_permissao está vazia; todas as rotas protegidas retornarão 403.");
}

let papeisCadastrados = new Set();

// vinculo_institucional.papel guarda o código do papel (FK para papel.codigo). Confere se o código existe e o devolve.
export async function papelValido(codigo) {
  if (!papeisCadastrados.size) {
    const linhas = await consultar(supabase.from("papel").select("codigo"));
    papeisCadastrados = new Set(linhas.map((l) => l.codigo));
  }
  if (!papeisCadastrados.has(codigo)) throw new ErroHttp(400, "Papel inválido.");
  return codigo;
}

export const temPermissao = (papel, permissao) => !!permissoesPorPapel.get(papel)?.has(permissao);

export async function autenticar(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) throw new ErroHttp(401, "Não autenticado.");
    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new ErroHttp(401, "Sessão inválida ou expirada.");
    }
    const usuario = await consultar(supabase.from("usuario").select("id, nome, email, status, superadmin, anonimizado_em").eq("id", payload.sub).maybeSingle());
    if (!usuario || usuario.status !== "ativo" || usuario.anonimizado_em) throw new ErroHttp(401, "Sessão inválida ou expirada.");
    req.usuario = { id: usuario.id, nome: usuario.nome, email: usuario.email, status: usuario.status, superadmin: usuario.superadmin };
    next();
  } catch (e) {
    next(e);
  }
}

export async function contexto(req, _res, next) {
  try {
    req.instituicaoId = null;
    req.papel = req.usuario.superadmin ? "superadmin" : null;
    const bruto = req.get("x-instituicao-id");
    if (!bruto) return next();
    const id = Number(bruto);
    if (!Number.isInteger(id) || id <= 0) throw new ErroHttp(403, "Acesso negado.");
    if (req.usuario.superadmin) {
      const inst = await consultar(supabase.from("instituicao").select("id").eq("id", id).maybeSingle());
      if (!inst) throw new ErroHttp(403, "Acesso negado.");
      req.instituicaoId = id;
      return next();
    }
    const vinculo = await consultar(
      supabase.from("vinculo_institucional").select("situacao, papel, instituicao:instituicao_id(status)")
        .eq("usuario_id", req.usuario.id).eq("instituicao_id", id).maybeSingle(),
    );
    if (!vinculo || vinculo.situacao !== "ativo" || vinculo.instituicao?.status !== "ativa") throw new ErroHttp(403, "Acesso negado.");
    req.instituicaoId = id;
    req.papel = vinculo.papel ?? null;
    next();
  } catch (e) {
    next(e);
  }
}

export const exigePermissao = (...permissoes) => (req, _res, next) => {
  if (!req.papel || !req.instituicaoId) return next(new ErroHttp(403, "Acesso negado."));
  if (permissoes.some((p) => temPermissao(req.papel, p))) return next();
  next(new ErroHttp(403, "Acesso negado."));
};

export const exigeSuperadmin = (req, _res, next) => (req.usuario.superadmin ? next() : next(new ErroHttp(403, "Acesso negado.")));

export const exigeInstituicao = (req, _res, next) => (req.instituicaoId ? next() : next(new ErroHttp(403, "Selecione uma instituição.")));
