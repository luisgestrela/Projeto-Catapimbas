import { ErroHttp } from "./supabase.js";

export const invalido = (mensagem, campos) => new ErroHttp(400, mensagem, campos);

export function texto(valor, campo, { min = 1, max = 200, obrigatorio = true } = {}) {
  const s = String(valor ?? "").trim();
  if (!s && !obrigatorio) return "";
  if (s.length < min || s.length > max) throw invalido(`Campo inválido: ${campo}.`, { [campo]: `Informe ${campo} com ${min} a ${max} caracteres.` });
  return s;
}

export function inteiro(valor, campo, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) throw invalido(`Campo inválido: ${campo}.`, { [campo]: "Valor inválido." });
  return n;
}

export function listaIds(valor, campo) {
  if (valor === undefined || valor === null) return [];
  if (!Array.isArray(valor)) throw invalido(`Campo inválido: ${campo}.`);
  return [...new Set(valor.map((v) => inteiro(v, campo)))];
}

export function opcao(valor, campo, permitidos) {
  if (!permitidos.includes(valor)) throw invalido(`Campo inválido: ${campo}.`, { [campo]: "Valor não permitido." });
  return valor;
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PAPEIS = ["administrador", "coordenador", "orientador", "avaliador", "aluno"];
export const PAPEIS_SOLICITAVEIS = ["coordenador", "orientador", "avaliador", "aluno"];
