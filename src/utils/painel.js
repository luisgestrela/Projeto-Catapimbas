import { calcularRanking } from "../../shared/ranking.js";

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const bancaAberta = (b, hoje = new Date().toISOString().slice(0, 10)) => b.resultado !== "publicado" && hoje <= b.fim;

export function projetosDoEscopo(projetos, bancas, f = {}) {
  const daBanca = f.bancaId ? new Set(bancas.find((b) => b.id === Number(f.bancaId))?.projetosIds || []) : null;
  return projetos.filter((p) =>
    (!f.ano || p.ano === Number(f.ano))
    && (!f.semestre || String(p.semestre) === String(f.semestre))
    && (!f.curso || norm(p.curso) === norm(f.curso))
    && (!daBanca || daBanca.has(p.id)));
}

export function calcularPainel({ projetos = [], bancas = [], avaliacoes = [] }, f = {}, hoje) {
  const escopo = projetosDoEscopo(projetos, bancas, f);
  const ids = new Set(escopo.map((p) => p.id));
  const filtrando = !!(f.ano || f.semestre || f.curso);
  const bancasEscopo = bancas
    .filter((b) => (!f.bancaId || b.id === Number(f.bancaId)) && (!filtrando || b.projetosIds.some((id) => ids.has(id))))
    .sort((a, b) => b.fim.localeCompare(a.fim) || b.id - a.id);

  const avaliados = new Set();
  const porBanca = bancasEscopo.map((b) => {
    const inelegiveis = new Set(b.inelegiveisIds || []);
    const elegiveis = new Set(b.projetosIds.filter((id) => ids.has(id) && !inelegiveis.has(id)));
    const feitas = avaliacoes.filter((a) => a.bancaId === b.id && elegiveis.has(a.projetoId));
    feitas.forEach((a) => avaliados.add(a.projetoId));
    const previstas = elegiveis.size * b.avaliadoresIds.length;
    return {
      id: b.id,
      nome: b.nome,
      previstas,
      concluidas: feitas.length,
      pendentes: bancaAberta(b, hoje) ? Math.max(0, previstas - feitas.length) : 0,
    };
  });

  const contar = (fn) => Object.entries(escopo.reduce((m, p) => ({ ...m, [fn(p)]: (m[fn(p)] || 0) + 1 }), {})).map(([nome, valor]) => ({ nome, valor }));
  const concluidas = porBanca.reduce((s, b) => s + b.concluidas, 0);
  const pendentes = porBanca.reduce((s, b) => s + b.pendentes, 0);

  const bancaRanking = bancasEscopo.find((b) => calcularRanking({ projetos, avaliacoes }, b).length > 0) || bancasEscopo[0] || null;
  const ranking = bancaRanking ? rankingFiltrado({ projetos, avaliacoes }, bancaRanking, f) : [];

  return {
    indicadores: {
      projetos: escopo.length,
      projetosAvaliados: avaliados.size,
      bancas: bancasEscopo.length,
      avaliacoesConcluidas: concluidas,
      avaliacoesPendentes: pendentes,
    },
    porPeriodo: contar((p) => `${p.ano}/${p.semestre}`).sort((a, b) => a.nome.localeCompare(b.nome)),
    porStatus: contar((p) => (p.status === "ativo" ? "Ativo" : "Arquivado")),
    porAvaliacao: [{ nome: "Concluídas", valor: concluidas }, { nome: "Pendentes", valor: pendentes }].filter((x) => x.valor > 0),
    porBanca,
    bancaRanking,
    ranking,
  };
}

export function rankingFiltrado(db, banca, f = {}) {
  const ids = new Set(projetosDoEscopo(db.projetos, [], { ...f, bancaId: "" }).map((p) => p.id));
  const porId = new Map(db.projetos.map((p) => [p.id, p]));
  return calcularRanking(db, banca)
    .filter((l) => ids.has(l.projetoId))
    .map((l) => ({ ...l, curso: porId.get(l.projetoId)?.curso || "", periodo: `${porId.get(l.projetoId)?.ano}/${porId.get(l.projetoId)?.semestre}` }));
}
