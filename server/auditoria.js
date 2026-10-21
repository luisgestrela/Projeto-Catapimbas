import { consultar, supabase } from "./supabase.js";

// Grava direto na tabela public.auditoria (schema já existente no Supabase).
export const auditar = (req, instituicaoId, operacao, entidade, detalhes) =>
  consultar(supabase.from("auditoria").insert({
    instituicao_id: instituicaoId ?? null, ator_usuario_id: req.usuario.id, operacao: String(operacao).slice(0, 100),
    tabela: String(operacao).slice(0, 100), entidade_id: entidade == null ? null : String(entidade), motivo: detalhes ?? null, ip: req.ip || null,
  }));
