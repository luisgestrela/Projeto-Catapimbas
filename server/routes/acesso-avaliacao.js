import crypto from "node:crypto";
import { Router } from "express";
import { abrirSessao } from "../auth.js";
import { ErroHttp, consultar, supabase } from "../supabase.js";
import { inteiro } from "../validar.js";

const r = Router();
const hashToken = (token) => crypto.createHash("sha256").update(String(token || "")).digest("hex");

async function carregarAcesso(token) {
  const valor = String(token || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(valor)) throw new ErroHttp(404, "Link de avaliação inválido ou expirado.");
  const acesso = await consultar(
    supabase.from("avaliacao_acesso")
      .select("id, instituicao_id, banca_id, projeto_id, avaliador_id, expira_em, usado_em")
      .eq("token_hash", hashToken(valor)).maybeSingle(),
  );
  if (!acesso || acesso.usado_em || new Date(acesso.expira_em) <= new Date()) {
    throw new ErroHttp(410, "Este link de avaliação já foi utilizado ou expirou.");
  }
  const [usuario, projeto, banca, vinculo] = await Promise.all([
    consultar(supabase.from("usuario").select("id, nome").eq("id", acesso.avaliador_id).maybeSingle()),
    consultar(supabase.from("projeto").select("id, nome").eq("id", acesso.projeto_id).eq("instituicao_id", acesso.instituicao_id).maybeSingle()),
    consultar(supabase.from("banca").select("id, nome, inicio, fim, resultado").eq("id", acesso.banca_id).eq("instituicao_id", acesso.instituicao_id).maybeSingle()),
    consultar(supabase.from("vinculo_institucional").select("situacao, papel").eq("usuario_id", acesso.avaliador_id).eq("instituicao_id", acesso.instituicao_id).maybeSingle()),
  ]);
  if (!usuario || !projeto || !banca || !vinculo || vinculo.situacao !== "ativo" || vinculo.papel !== "avaliador") {
    throw new ErroHttp(410, "Este link não está mais disponível para avaliação.");
  }
  const designados = await consultar(
    supabase.from("banca_avaliador").select("vinculo_id").eq("banca_id", acesso.banca_id).eq("instituicao_id", acesso.instituicao_id),
  );
  const idsVinculos = designados.map((d) => d.vinculo_id);
  const vinculos = idsVinculos.length
    ? await consultar(supabase.from("vinculo_institucional").select("id, usuario_id, situacao, papel").in("id", idsVinculos).eq("instituicao_id", acesso.instituicao_id))
    : [];
  const idsUsuarios = vinculos.filter((v) => v.situacao === "ativo" && v.papel === "avaliador").map((v) => v.usuario_id);
  const pessoas = idsUsuarios.length ? await consultar(supabase.from("usuario").select("id, nome").in("id", idsUsuarios)) : [];
  return { acesso, usuario, projeto, banca, avaliadores: pessoas.sort((a, b) => a.nome.localeCompare(b.nome)) };
}

r.get("/:token", async (req, res) => {
  const { acesso, usuario, projeto, banca, avaliadores } = await carregarAcesso(req.params.token);
  res.json({
    avaliador: { id: usuario.id, nome: usuario.nome },
    avaliadores,
    projeto: { id: projeto.id, nome: projeto.nome },
    banca: { id: banca.id, nome: banca.nome, inicio: banca.inicio, fim: banca.fim },
    expiraEm: acesso.expira_em,
  });
});

r.post("/:token/entrar", async (req, res) => {
  const usuarioId = inteiro(req.body?.usuarioId, "usuarioId");
  const { acesso, usuario, projeto, banca } = await carregarAcesso(req.params.token);
  if (usuarioId !== usuario.id) throw new ErroHttp(403, "Selecione o avaliador autorizado por este link.");

  const consumido = await consultar(
    supabase.from("avaliacao_acesso").update({ usado_em: new Date().toISOString() })
      .eq("id", acesso.id).is("usado_em", null).select("id").maybeSingle(),
  );
  if (!consumido) throw new ErroHttp(410, "Este link já foi utilizado ou expirou.");

  abrirSessao(res, usuario.id);
  res.json({ instituicaoId: acesso.instituicao_id, bancaId: banca.id, projetoId: projeto.id, usuario: { id: usuario.id, nome: usuario.nome } });
});

export default r;
