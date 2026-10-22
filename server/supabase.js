import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

// Cliente exclusivo do backend (service role, ignora RLS). Nunca exponha esta chave ao frontend.
// A autorização é feita pelo próprio servidor (autenticar/contexto/exigePermissao).
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

export class ErroHttp extends Error {
  constructor(status, mensagem, campos) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
  }
}

const ERROS_NEGOCIO = {
  nome_obrigatorio: [400, "Informe o nome."],
  titulo_obrigatorio: [400, "Informe o título do critério."],
  peso_invalido: [400, "O peso deve ser maior que zero."],
  periodo_invalido: [400, "O fim não pode ser anterior ao início."],
  orientador_invalido: [400, "Orientador inválido para esta instituição."],
  aluno_invalido: [400, "Aluno inválido para esta instituição."],
  projeto_invalido: [400, "Projeto inválido para esta instituição."],
  avaliador_invalido: [400, "Avaliador inválido para esta instituição."],
  instrumento_invalido: [400, "Instrumento inválido para esta instituição."],
  banca_indisponivel: [409, "A banca não pode mais ser editada."],
  banca_fechada: [409, "Esta banca não está aberta para avaliação."],
  avaliador_nao_designado: [403, "Você não está designado nesta banca."],
  projeto_fora_da_banca: [400, "O projeto não participa desta banca."],
  avaliacao_duplicada: [409, "Você já avaliou este projeto nesta banca."],
  nota_ausente: [400, "Informe a nota de todos os critérios."],
  nota_fora_da_escala: [400, "Nota fora da escala do critério."],
  justificativa_obrigatoria: [400, "Justificativa obrigatória."],
  nota_imutavel: [409, "Notas enviadas não podem ser alteradas diretamente."],
  avaliador_com_notas: [409, "Não é possível remover um avaliador que já lançou notas nesta banca."],
  nao_encontrado: [404, "Registro não encontrado."],
};

// SQLSTATE de dados rejeitados pelo banco: FK (23503), CHECK (23514), formato (22P02), faixa numérica (22003) e data/hora inválida (22007, 22008).
const CODIGOS_DADOS_INVALIDOS = ["23503", "23514", "22P02", "22003", "22007", "22008"];

export function converterErro(error) {
  const [status, mensagem] = ERROS_NEGOCIO[error?.message] || [];
  if (status) return new ErroHttp(status, mensagem);
  if (error?.code === "23505") return new ErroHttp(409, "Registro duplicado.");
  if (error?.code === "42501" || error?.code === "PGRST301") return new ErroHttp(500, "Erro de permissão no banco. Verifique a SUPABASE_SERVICE_ROLE_KEY.");
  if (CODIGOS_DADOS_INVALIDOS.includes(error?.code)) return new ErroHttp(400, "Dados inválidos.");
  return new ErroHttp(500, "Erro interno.");
}

export async function consultar(promessa) {
  const { data, error } = await promessa;
  if (error) {
    if (!ERROS_NEGOCIO[error.message] && error.code !== "23505" && !CODIGOS_DADOS_INVALIDOS.includes(error.code)) console.error("supabase:", error.code, error.message);
    throw converterErro(error);
  }
  return data;
}

export const rpc = (nome, args) => consultar(supabase.rpc(nome, args));
