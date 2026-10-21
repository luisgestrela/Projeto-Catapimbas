import { calcularRanking } from "../shared/ranking.js";
import { consultar, supabase } from "./supabase.js";

const em = (tabela, colunas, coluna, ids, extra = {}) => {
  if (!ids.length) return Promise.resolve([]);
  let q = supabase.from(tabela).select(colunas).in(coluna, ids);
  for (const [k, v] of Object.entries(extra)) q = q.eq(k, v);
  return consultar(q.limit(10000));
};

export async function dadosDaBanca(inst, bancaId) {
  const banca = await consultar(
    supabase.from("banca").select("id, nome, resultado, inicio, fim").eq("id", bancaId).eq("instituicao_id", inst).maybeSingle(),
  );
  if (!banca) return null;
  const [bps, bcs, bas] = await Promise.all([
    consultar(supabase.from("banca_projeto").select("id, projeto_id, elegivel").eq("banca_id", bancaId).eq("instituicao_id", inst)),
    consultar(supabase.from("banca_criterio").select("id, criterio_versao_id, peso").eq("banca_id", bancaId).eq("instituicao_id", inst)),
    consultar(supabase.from("banca_avaliador").select("id, vinculo_id").eq("banca_id", bancaId).eq("instituicao_id", inst)),
  ]);
  const projetos = await em("projeto", "id, nome", "id", bps.map((x) => x.projeto_id));
  const versoes = await em("criterio_versao", "id, titulo", "id", bcs.map((x) => x.criterio_versao_id));
  const vinculos = await em("vinculo_institucional", "id, usuario_id", "id", bas.map((x) => x.vinculo_id));
  const usuarios = await em("usuario", "id, nome", "id", vinculos.map((v) => v.usuario_id));
  const avs = await consultar(
    supabase.from("avaliacao").select("id, banca_projeto_id, banca_avaliador_id").eq("banca_id", bancaId).eq("instituicao_id", inst).eq("status", "enviada"),
  );
  const notas = await em("avaliacao_nota", "avaliacao_id, banca_criterio_id, nota", "avaliacao_id", avs.map((a) => a.id));

  const tituloPorVersao = new Map(versoes.map((v) => [v.id, v.titulo]));
  const bcPorId = new Map(bcs.map((bc) => [bc.id, bc]));
  const bpPorId = new Map(bps.map((x) => [x.id, x]));
  const usuarioPorVinculo = new Map(vinculos.map((v) => [v.id, v.usuario_id]));
  const vinculoPorBa = new Map(bas.map((x) => [x.id, x.vinculo_id]));
  const nomePorUsuario = new Map(usuarios.map((u) => [u.id, u.nome]));
  const avaliadoresIds = bas.map((x) => usuarioPorVinculo.get(x.vinculo_id));
  const criterios = bcs.map((bc) => ({ id: bc.criterio_versao_id, titulo: tituloPorVersao.get(bc.criterio_versao_id), peso: Number(bc.peso) }));

  const avaliacoes = avs.map((a) => ({
    id: a.id, bancaId, projetoId: bpPorId.get(a.banca_projeto_id).projeto_id,
    avaliadorId: usuarioPorVinculo.get(vinculoPorBa.get(a.banca_avaliador_id)), criterios,
    notas: Object.fromEntries(notas.filter((n) => n.avaliacao_id === a.id).map((n) => [bcPorId.get(n.banca_criterio_id).criterio_versao_id, n.nota])),
  }));
  const bancaDb = {
    id: bancaId, projetosIds: bps.map((x) => x.projeto_id), inelegiveisIds: bps.filter((x) => !x.elegivel).map((x) => x.projeto_id), avaliadoresIds,
  };
  const db = { projetos, avaliacoes };
  return { banca, bancaDb, db, nomePorUsuario, ranking: calcularRanking(db, bancaDb) };
}
