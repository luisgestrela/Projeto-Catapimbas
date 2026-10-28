export const CRITERIO_DESEMPATE = "maior nota média no critério de maior peso";

const arredondar = (n) => Math.round(n * 1e4) / 1e4;
const somar = (xs) => [...xs].sort((a, b) => a - b).reduce((s, x) => s + x, 0);
const media = (xs) => (xs.length ? somar(xs) / xs.length : 0);
const porPeso = (x, y) => y.peso - x.peso || x.id - y.id;

const ponderada = (a) => {
  const total = a.criterios.reduce((s, c) => s + c.peso, 0);
  if (!total) return 0;
  return somar(a.criterios.map((c) => (a.notas[c.id] ?? 0) * c.peso)) / total;
};

const notaDoCriterioPrincipal = (a) => {
  const principal = [...a.criterios].sort(porPeso)[0];
  return principal ? a.notas[principal.id] ?? 0 : 0;
};

export function calcularRanking(db, banca) {
  const inelegiveis = new Set(banca.inelegiveisIds || []);
  const nomes = new Map(db.projetos.map((p) => [p.id, p.nome]));
  const linhas = [];
  for (const projetoId of banca.projetosIds) {
    if (inelegiveis.has(projetoId)) continue;
    const avs = db.avaliacoes.filter((a) => a.bancaId === banca.id && a.projetoId === projetoId);
    if (!avs.length) continue;
    linhas.push({
      projetoId,
      projeto: nomes.get(projetoId) ?? "—",
      pontuacao: arredondar(media(avs.map(ponderada))),
      desempate: arredondar(media(avs.map(notaDoCriterioPrincipal))),
      avaliacoes: avs.length,
    });
  }
  linhas.sort((a, b) => b.pontuacao - a.pontuacao || b.desempate - a.desempate || a.projeto.localeCompare(b.projeto) || a.projetoId - b.projetoId);
  const mesmoPlacar = (a, b) => a.pontuacao === b.pontuacao && a.desempate === b.desempate;
  return linhas.map((l) => ({
    ...l,
    posicao: linhas.findIndex((x) => mesmoPlacar(x, l)) + 1,
    empatado: linhas.filter((x) => mesmoPlacar(x, l)).length > 1,
  }));
}
