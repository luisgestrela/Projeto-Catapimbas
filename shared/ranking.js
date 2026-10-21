export const CRITERIO_DESEMPATE = "maior nota média no critério de maior peso";

const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

const ponderada = (a) => {
  const soma = a.criterios.reduce((s, c) => s + c.peso, 0);
  return a.criterios.reduce((s, c) => s + (a.notas[c.id] ?? 0) * c.peso, 0) / soma;
};

export function calcularRanking(db, banca) {
  const inelegiveis = banca.inelegiveisIds || [];
  const linhas = banca.projetosIds.filter((pid) => !inelegiveis.includes(pid)).map((pid) => {
    const avs = db.avaliacoes.filter((a) => a.bancaId === banca.id && a.projetoId === pid);
    if (!avs.length) return null;
    const topo = avs.map((a) => a.notas[[...a.criterios].sort((x, y) => y.peso - x.peso)[0].id] ?? 0);
    return {
      projetoId: pid,
      projeto: db.projetos.find((p) => p.id === pid)?.nome ?? "—",
      pontuacao: media(avs.map(ponderada)),
      desempate: media(topo),
      avaliacoes: avs.length,
    };
  }).filter(Boolean);
  const chave = (l) => `${l.pontuacao.toFixed(4)}|${l.desempate.toFixed(4)}`;
  linhas.sort((a, b) => b.pontuacao - a.pontuacao || b.desempate - a.desempate);
  return linhas.map((l) => {
    const primeiro = linhas.findIndex((x) => chave(x) === chave(l));
    return { ...l, posicao: primeiro + 1, empatado: linhas.filter((x) => chave(x) === chave(l)).length > 1 };
  });
}
