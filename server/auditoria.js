import { consultar, supabase } from "./supabase.js";

// Grava em public.auditoria com o mesmo formato de registrar_auditoria() (SQL), usado pelas RPCs:
// operacao = tipo do evento, entidade = nome exibido do registro afetado, detalhes = descrição em texto.
// O endereço IP vem da coluna adicionada em 20261021000100_backend_colunas.sql.
export const auditar = (req, instituicaoId, operacao, entidade, detalhes) =>
  consultar(supabase.from("auditoria").insert({
    instituicao_id: instituicaoId ?? null, ator_id: req.usuario.id, ator_nome: req.usuario.nome,
    operacao: String(operacao).slice(0, 100), entidade: entidade == null ? null : String(entidade), detalhes: detalhes ?? null,
    ip: req.ip || null,
  }));
