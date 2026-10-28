// Música do pódio: um único objeto Audio, pré-carregado antes de abrir o pódio.
export const MUSICA = `${import.meta.env.BASE_URL}we-are-the-champions.mp3`;
const cache = new Map();
export function obterAudio(src = MUSICA) {
  if (!cache.has(src)) { const a = new Audio(); a.preload = "auto"; a.src = src; cache.set(src, a); }
  return cache.get(src);
}
