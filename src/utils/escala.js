// Rótulos sugeridos para cada nota de uma escala. Servem de apoio quando o administrador
// ainda não cadastrou o descritor de uma nota; o descritor cadastrado sempre tem prioridade.
const REFERENCIA = [
  "Não cumpriu nenhum requisito",
  "Cumpriu alguns requisitos",
  "Cumpriu os requisitos essenciais",
  "Cumpriu todos os requisitos",
  "Superou os requisitos",
];

export function rotulosEscala(min, max) {
  const n = Number(max) - Number(min) + 1;
  if (!Number.isInteger(n) || n < 2) return {};
  const textos =
    n === 2 ? ["Não cumpriu", "Cumpriu"]
    : n === 3 ? [REFERENCIA[0], "Cumpriu parte dos requisitos", REFERENCIA[3]]
    : Array.from({ length: n }, (_, i) => REFERENCIA[Math.round((i * (REFERENCIA.length - 1)) / (n - 1))]);
  return Object.fromEntries(textos.map((t, i) => [Number(min) + i, t]));
}
