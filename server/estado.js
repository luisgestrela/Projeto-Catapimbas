import { consultar, supabase } from "./supabase.js";
import { temPermissao } from "./auth.js";

const FUSO = "America/Bahia";
export const formatarDataHora = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: FUSO }) : "");
export const formatarDia = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: FUSO }) : "");
const isoDia = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: FUSO });

const agrupar = (linhas, chave) => {
  const mapa = new Map();
  for (const l of linhas) {
    const k = l[chave];
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k).push(l);
  }
  return mapa;
};

const buscar = async (tabela, colunas, filtros = {}, dentro = null) => {
  let q = supabase.from(tabela).select(colunas);
  for (const [k, v] of Object.entries(filtros)) if (v !== null && v !== undefined) q = q.eq(k, v);
  if (dentro) {
    const [coluna, ids] = dentro;
    if (!ids.length) return [];
    q = q.in(coluna, ids);
  }
  return consultar(q.limit(5000));
};

export const mapearInstituicao = (i) => ({
  id: i.id, nome: i.nome, identificador: i.identificador, status: i.status, corPrimaria: i.cor_primaria, logoUrl: i.logo_url || "",
});

const mapearVinculo = (v) => ({
  instituicaoId: v.instituicao_id, papel: v.papel, situacao: v.situacao, justificativa: v.justificativa || undefined, data: formatarDia(v.solicitado_em),
});

export async function vinculosDoUsuario(usuarioId) {
  const linhas = await buscar("vinculo_institucional", "instituicao_id, situacao, justificativa, solicitado_em, papel", { usuario_id: usuarioId });
  return linhas.filter((v) => v.situacao !== "revogado").map(mapearVinculo);
}

export async function listarProjetos(inst) {
  const filtro = { instituicao_id: inst };
  const [projetos, equipes, orientacoes, integrantes] = await Promise.all([
    buscar("projeto", "id, instituicao_id, nome, descricao, ano, semestre, status", filtro),
    buscar("equipe", "id, projeto_id, nome", filtro),
    buscar("orientacao", "projeto_id, orientador_id", filtro),
    buscar("integrante", "equipe_id, usuario_id", filtro),
  ]);
  const equipePorProjeto = new Map(equipes.map((e) => [e.projeto_id, e]));
  const orientadorPorProjeto = new Map(orientacoes.map((o) => [o.projeto_id, o.orientador_id]));
  const alunosPorEquipe = agrupar(integrantes, "equipe_id");
  return projetos.map((p) => {
    const eq = equipePorProjeto.get(p.id);
    return {
      id: p.id, instituicaoId: p.instituicao_id, nome: p.nome, descricao: p.descricao || "", status: p.status, ano: p.ano, semestre: p.semestre,
      orientadorId: orientadorPorProjeto.get(p.id) ?? null, equipe: eq?.nome || "",
      alunosIds: eq ? (alunosPorEquipe.get(eq.id) || []).map((i) => i.usuario_id) : [],
    };
  });
}

async function listarInstrumentos(inst) {
  const [instrumentos, criterios] = await Promise.all([
    buscar("instrumento", "id, instituicao_id, nome, descricao, arquivado_em", { instituicao_id: inst }),
    buscar("criterio", "id, instrumento_id, ordem, arquivado_em", { instituicao_id: inst }),
  ]);
  const instrumentosAtivos = instrumentos.filter((i) => !i.arquivado_em);
  const criteriosAtivos = criterios.filter((c) => !c.arquivado_em);
  const versoes = await buscar("criterio_versao", "id, criterio_id, versao, titulo, descricao, nota_min, nota_max, peso_sugerido", { instituicao_id: inst });
  const descritores = await buscar("descritor", "criterio_versao_id, nota, texto", { instituicao_id: inst });
  const ultima = new Map();
  for (const v of versoes) if (!ultima.has(v.criterio_id) || ultima.get(v.criterio_id).versao < v.versao) ultima.set(v.criterio_id, v);
  const descPorVersao = agrupar(descritores, "criterio_versao_id");
  const porInstrumento = agrupar(criteriosAtivos, "instrumento_id");
  return instrumentosAtivos.map((i) => ({
    id: i.id, instituicaoId: i.instituicao_id, nome: i.nome, descricao: i.descricao || "",
    criterios: (porInstrumento.get(i.id) || []).sort((a, b) => a.ordem - b.ordem).map((c) => ultima.get(c.id)).filter(Boolean).map((v) => ({
      id: v.id, versao: v.versao, titulo: v.titulo, descricao: v.descricao || "", peso: Number(v.peso_sugerido),
      escala: { min: v.nota_min, max: v.nota_max },
      descritores: Object.fromEntries((descPorVersao.get(v.id) || []).map((d) => [d.nota, d.texto])),
    })),
  }));
}

export async function montarEstado(req) {
  const { usuario, instituicaoId: inst, papel } = req;
  const meusVinculos = await vinculosDoUsuario(usuario.id);
  const eu = { id: usuario.id, nome: usuario.nome, email: usuario.email, superadmin: usuario.superadmin, vinculos: meusVinculos };
  const db = { instituicoes: [], usuarios: [eu], projetos: [], instrumentos: [], bancas: [], avaliacoes: [], auditoria: [] };

  if (usuario.superadmin) {
    db.instituicoes = (await buscar("instituicao", "id, nome, identificador, status, cor_primaria, logo_url")).map(mapearInstituicao);
  } else {
    const ids = meusVinculos.map((v) => v.instituicaoId);
    db.instituicoes = (await buscar("instituicao", "id, nome, identificador, status, cor_primaria, logo_url", {}, ["id", ids])).map(mapearInstituicao);
  }

  if (!inst && !usuario.superadmin) return { usuario: eu, db };

  const gerencia = !!inst && (usuario.superadmin || temPermissao(papel, "banca:gerir"));
  const todosProjetos = await listarProjetos(inst);
  let projetosPropriosIds;
  if (usuario.superadmin || gerencia) projetosPropriosIds = todosProjetos.map((p) => p.id);
  else if (papel === "orientador") projetosPropriosIds = todosProjetos.filter((p) => p.orientadorId === usuario.id).map((p) => p.id);
  else if (papel === "aluno") projetosPropriosIds = todosProjetos.filter((p) => p.alunosIds.includes(usuario.id)).map((p) => p.id);
  else projetosPropriosIds = [];

  let bancasVisiveis = [];
  let avaliacoesDb = [];
  if (inst) {
    const filtro = { instituicao_id: inst };
    const [bancas, bps, bas, bcs, vinculos] = await Promise.all([
      buscar("banca", "id, instituicao_id, instrumento_id, nome, inicio, fim, resultado", filtro),
      buscar("banca_projeto", "id, banca_id, projeto_id, elegivel", filtro),
      buscar("banca_avaliador", "id, banca_id, vinculo_id", filtro),
      buscar("banca_criterio", "id, banca_id, criterio_versao_id, peso, ordem", filtro),
      buscar("vinculo_institucional", "id, usuario_id, papel, situacao, justificativa, solicitado_em, instituicao_id", filtro),
    ]);
    const usuarioPorVinculo = new Map(vinculos.map((v) => [v.id, v.usuario_id]));
    const bpPorBanca = agrupar(bps, "banca_id");
    const baPorBanca = agrupar(bas, "banca_id");
    const bcPorBanca = agrupar(bcs, "banca_id");
    const versoes = await buscar("criterio_versao", "id, titulo, descricao, nota_min, nota_max", filtro);
    const descritores = await buscar("descritor", "criterio_versao_id, nota, texto", filtro);
    const versaoPorId = new Map(versoes.map((v) => [v.id, v]));
    const descPorVersao = agrupar(descritores, "criterio_versao_id");

    const completas = bancas.map((b) => {
      const bp = bpPorBanca.get(b.id) || [];
      const criterios = (bcPorBanca.get(b.id) || []).sort((x, y) => x.ordem - y.ordem).map((bc) => {
        const v = versaoPorId.get(bc.criterio_versao_id);
        return {
          id: bc.criterio_versao_id, titulo: v.titulo, descricao: v.descricao || "", peso: Number(bc.peso),
          escala: { min: v.nota_min, max: v.nota_max },
          descritores: Object.fromEntries((descPorVersao.get(v.id) || []).map((d) => [d.nota, d.texto])),
        };
      });
      return {
        id: b.id, instituicaoId: b.instituicao_id, nome: b.nome, inicio: b.inicio, fim: b.fim, instrumentoId: b.instrumento_id, resultado: b.resultado,
        projetosIds: bp.map((x) => x.projeto_id), inelegiveisIds: bp.filter((x) => !x.elegivel).map((x) => x.projeto_id),
        avaliadoresIds: (baPorBanca.get(b.id) || []).map((x) => usuarioPorVinculo.get(x.vinculo_id)),
        pesos: Object.fromEntries(criterios.map((c) => [c.id, c.peso])), criterios,
      };
    });

    if (gerencia) bancasVisiveis = completas;
    else if (papel === "avaliador") bancasVisiveis = completas.filter((b) => b.avaliadoresIds.includes(usuario.id));
    else if (papel === "orientador") {
      // Acompanhamento: só as bancas em que há projetos do orientador, sem avaliadores, critérios nem projetos de terceiros.
      bancasVisiveis = completas.filter((b) => b.projetosIds.some((id) => projetosPropriosIds.includes(id))).map((b) => ({
        id: b.id, instituicaoId: b.instituicaoId, nome: b.nome, inicio: b.inicio, fim: b.fim, instrumentoId: b.instrumentoId, resultado: b.resultado,
        projetosIds: b.projetosIds.filter((id) => projetosPropriosIds.includes(id)), inelegiveisIds: [], avaliadoresIds: [], pesos: {}, criterios: [],
      }));
    } else bancasVisiveis = []; // aluno: não há área de bancas, apenas os projetos em que é integrante

    const idsBancas = bancasVisiveis.map((b) => b.id);
    const avs = await buscar("avaliacao", "id, banca_id, banca_projeto_id, banca_avaliador_id, versao, protocolo, enviada_em", { ...filtro, status: "enviada" }, ["banca_id", idsBancas]);
    const notas = await buscar("avaliacao_nota", "avaliacao_id, banca_criterio_id, nota", filtro, ["avaliacao_id", avs.map((a) => a.id)]);
    const bcPorId = new Map(bcs.map((bc) => [bc.id, bc]));
    const notasPorAv = agrupar(notas, "avaliacao_id");
    const bpPorId = new Map(bps.map((x) => [x.id, x]));
    const baPorId = new Map(bas.map((x) => [x.id, x]));
    const bancaPorId = new Map(bancasVisiveis.map((b) => [b.id, b]));
    avaliacoesDb = avs.map((a) => {
      const banca = bancaPorId.get(a.banca_id);
      return {
        id: a.id, bancaId: a.banca_id, projetoId: bpPorId.get(a.banca_projeto_id).projeto_id,
        avaliadorId: usuarioPorVinculo.get(baPorId.get(a.banca_avaliador_id).vinculo_id), data: formatarDataHora(a.enviada_em),
        protocolo: a.protocolo, versao: a.versao,
        notas: Object.fromEntries((notasPorAv.get(a.id) || []).map((n) => [bcPorId.get(n.banca_criterio_id).criterio_versao_id, n.nota])),
        criterios: banca.criterios.map(({ id, titulo, peso }) => ({ id, titulo, peso })),
      };
    });
    if (gerencia) db.avaliacoes = avaliacoesDb;
    else if (papel === "avaliador") db.avaliacoes = avaliacoesDb.filter((a) => a.avaliadorId === usuario.id);
    else db.avaliacoes = []; // orientador e aluno não recebem notas: o resultado é consultado por coordenação e administração
    db.bancas = bancasVisiveis;

    const verEmail = temPermissao(papel, "usuario:aprovar") || gerencia;
    const verContato = verEmail || papel === "orientador"; // o orientador vê o contato dos integrantes dos seus projetos
    const vinculosVisiveis = vinculos.filter((v) => v.situacao !== "revogado" && (verEmail || v.situacao === "ativo"));
    const porUsuario = agrupar(vinculosVisiveis, "usuario_id");
    const idsUsuarios = new Set();
    if (papel === "aluno" || papel === "orientador") {
      // Só as pessoas dos próprios projetos (orientador e colegas de equipe): nada de listar a instituição inteira.
      for (const p of todosProjetos.filter((x) => projetosPropriosIds.includes(x.id))) {
        if (p.orientadorId) idsUsuarios.add(p.orientadorId);
        p.alunosIds.forEach((a) => idsUsuarios.add(a));
      }
    } else {
      porUsuario.forEach((_v, id) => idsUsuarios.add(id));
      for (const p of todosProjetos) {
        if (p.orientadorId) idsUsuarios.add(p.orientadorId);
        p.alunosIds.forEach((a) => idsUsuarios.add(a));
      }
    }
    idsUsuarios.delete(usuario.id);
    const pessoas = await buscar("usuario", "id, nome, email", {}, ["id", [...idsUsuarios]]);
    db.usuarios = [eu, ...pessoas.map((u) => ({
      id: u.id, nome: u.nome, email: verContato ? u.email : "",
      vinculos: (porUsuario.get(u.id) || []).map(mapearVinculo),
    }))];
  } else {
    // Sem instituição escolhida. O superadmin recebe todas as pessoas com seus vínculos ativos (de qualquer instituição),
    // para escolher a universidade e o aluno ao cadastrar projetos pela plataforma.
    const ids = new Set();
    todosProjetos.forEach((p) => { if (p.orientadorId) ids.add(p.orientadorId); p.alunosIds.forEach((a) => ids.add(a)); });
    ids.delete(usuario.id);
    if (usuario.superadmin) {
      const [todosVinculos, pessoas] = await Promise.all([
        buscar("vinculo_institucional", "usuario_id, papel, situacao, justificativa, solicitado_em, instituicao_id"),
        buscar("usuario", "id, nome, email"),
      ]);
      const ativos = agrupar(todosVinculos.filter((v) => v.situacao === "ativo"), "usuario_id");
      db.usuarios = [eu, ...pessoas.filter((u) => u.id !== usuario.id).map((u) => ({
        id: u.id, nome: u.nome, email: u.email, vinculos: (ativos.get(u.id) || []).map(mapearVinculo),
      }))];
    } else {
      const pessoas = await buscar("usuario", "id, nome", {}, ["id", [...ids]]);
      db.usuarios = [eu, ...pessoas.map((u) => ({ id: u.id, nome: u.nome, email: "", vinculos: [] }))];
    }
  }

  const idsBancaProjetos = new Set(bancasVisiveis.flatMap((b) => b.projetosIds));
  // Aluno e orientador só enxergam os próprios projetos; o avaliador também vê os projetos das bancas em que foi designado.
  const incluiProjetosDeBanca = papel !== "aluno" && papel !== "orientador";
  db.projetos = todosProjetos.filter((p) => projetosPropriosIds.includes(p.id) || (incluiProjetosDeBanca && idsBancaProjetos.has(p.id)));

  if (inst && gerencia) db.instrumentos = await listarInstrumentos(inst);
  if (inst && temPermissao(papel, "auditoria:ver")) {
    const regs = await consultar(
      supabase.from("auditoria").select("id, instituicao_id, operacao, entidade, detalhes, ator_nome, criado_em").eq("instituicao_id", inst).order("criado_em", { ascending: false }).limit(500),
    );
    db.auditoria = regs.map((r) => ({
      id: r.id, instituicaoId: r.instituicao_id, data: formatarDataHora(r.criado_em), iso: isoDia(r.criado_em),
      ator: r.ator_nome ?? "—", operacao: r.operacao, entidade: r.entidade ?? "", detalhes: r.detalhes ?? "",
    }));
  }

  return { usuario: eu, db };
}

export async function projetosDoPerfil(req) {
  const { usuario, instituicaoId: inst, papel } = req;
  const todos = await listarProjetos(inst);
  if (usuario.superadmin || temPermissao(papel, "projeto:ver_todos")) return todos;
  if (papel === "orientador") return todos.filter((p) => p.orientadorId === usuario.id);
  if (papel === "aluno") return todos.filter((p) => p.alunosIds.includes(usuario.id));
  return [];
}
