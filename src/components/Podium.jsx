import { useCallback, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { obterAudio } from "../utils/musica";
import Button from "./Button";
import Icon from "./Icon";

// ---- Linha do tempo (segundos dentro da música "We Are the Champions") ----
// A música começa em INICIO_MUSICA com volume baixo que sobe até o refrão.
// O 1º lugar é revelado exatamente quando o refrão entra (REFRAO_MUSICA).
// Se achar que o refrão entra um pouco antes/depois, ajuste só estes dois números.
export const INICIO_MUSICA = 78; // volta do piano, antes do crescendo
export const REFRAO_MUSICA = 110; // 1:50 — refrão: revela o 1º lugar

const NOMES = { 1: "Ouro", 2: "Prata", 3: "Bronze" };
const CORES_OURO = ["#FFD700", "#FFC107", "#FFF3B0", "#FFFFFF", "#FF9800"];
const iniciais = (n = "") => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

// Momento em que cada posição (exceto a 1ª) aparece: 3º cedo, 2º perto do clímax.
function agenda(posicoes) {
  const outras = posicoes.filter((p) => p > 1).sort((a, b) => b - a);
  const ini = INICIO_MUSICA + 3, fim = REFRAO_MUSICA - 12;
  return outras.map((p, i) => ({
    posicao: p,
    em: outras.length === 1 ? INICIO_MUSICA + (REFRAO_MUSICA - INICIO_MUSICA) * 0.45 : ini + (i * (fim - ini)) / (outras.length - 1),
  }));
}

export default function Podium({ colocados = [], audioSrc, autoStart = false }) {
  const palcoRef = useRef(null);
  const raf = useRef(0);
  const confeteTimer = useRef(0);
  const exec = useRef(0);
  const [iniciado, setIniciado] = useState(false);
  const [revelados, setRevelados] = useState([]);
  const [mudo, setMudo] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [flash, setFlash] = useState(false);
  const [abalo, setAbalo] = useState(false);
  const [semAudio, setSemAudio] = useState(false);
  const [terminou, setTerminou] = useState(false);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const cf = useRef(null); // confete desenhado em worker (fora da thread principal)
  const reduzido = useRef(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches).current;
  const audioDe = () => (audioSrc ? obterAudio(audioSrc) : null);

  useEffect(() => {
    if (reduzido) return;
    const canvas = Object.assign(document.createElement("canvas"), { className: "podium-confete" });
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    try { cf.current = confetti.create(canvas, { resize: true, useWorker: true }); } catch { cf.current = null; }
    return () => { cf.current?.reset?.(); cf.current = null; canvas.remove(); };
  }, [reduzido]);

  // Os três degraus aparecem sempre; os sem classificado são mostrados como vagos.
  const grupos = [2, 1, 3].map((p) => ({ posicao: p, itens: colocados.filter((c) => c.posicao === p) }));
  const posicoes = grupos.map((g) => g.posicao);

  const parar = useCallback(() => {
    exec.current++;
    cancelAnimationFrame(raf.current);
    clearInterval(confeteTimer.current);
    audioDe()?.pause();
    cf.current?.reset?.();
  }, [audioSrc]);

  useEffect(() => parar, [parar]);
  useEffect(() => { const a = audioDe(); if (a) a.muted = mudo; }, [mudo]);
  useEffect(() => { const a = audioDe(); if (terminou && a) a.volume = volume; }, [volume, terminou]);

  function explosaoOuro() {
    setFlash(true); setTimeout(() => setFlash(false), 900);
    setAbalo(true); setTimeout(() => setAbalo(false), 900);
    if (reduzido) return;
    const lancar = cf.current;
    if (!lancar) return;
    const base = { colors: CORES_OURO, disableForReducedMotion: true };
    lancar({ ...base, particleCount: 160, spread: 120, startVelocity: 55, origin: { x: 0.5, y: 0.65 } });
    lancar({ ...base, particleCount: 40, spread: 360, startVelocity: 25, shapes: ["star"], scalar: 1.4, ticks: 180, origin: { x: 0.5, y: 0.4 } });
    const fim = Date.now() + 14000;
    clearInterval(confeteTimer.current);
    confeteTimer.current = setInterval(() => {
      if (Date.now() > fim) return clearInterval(confeteTimer.current);
      lancar({ ...base, particleCount: 9, angle: 60, spread: 65, startVelocity: 60, origin: { x: 0, y: 0.8 } });
      lancar({ ...base, particleCount: 9, angle: 120, spread: 65, startVelocity: 60, origin: { x: 1, y: 0.8 } });
      lancar({ ...base, particleCount: 5, spread: 100, startVelocity: 20, gravity: 0.7, origin: { x: Math.random(), y: -0.05 } });
    }, 260);
  }

  function estouroMenor(posicao) {
    if (!cf.current) return;
    const cor = posicao === 3 ? ["#CD7F32", "#E9A15B", "#FFFFFF"] : ["#C0C0C0", "#E8E8E8", "#FFFFFF"];
    cf.current({ colors: cor, particleCount: 50, spread: 80, startVelocity: 35, origin: { x: posicao === 3 ? 0.8 : 0.2, y: 0.65 } });
  }

  async function iniciar() {
    parar();
    const meu = ++exec.current;
    setRevelados([]); setTerminou(false); setSemAudio(false); setIniciado(true);
    const audio = audioDe();
    let usaAudio = false;
    if (audio) {
      try {
        if (audio.readyState < 1) await new Promise((ok, erro) => { audio.addEventListener("loadedmetadata", ok, { once: true }); audio.addEventListener("error", erro, { once: true }); audio.load(); });
        audio.muted = mudo;
        audio.currentTime = INICIO_MUSICA;
        audio.volume = volumeRef.current * 0.5;
        await audio.play();
        usaAudio = true;
      } catch { setSemAudio(true); }
    }
    if (meu !== exec.current) return;

    const t0 = performance.now();
    const tempo = () => (usaAudio && !audio.paused ? audio.currentTime : INICIO_MUSICA + (performance.now() - t0) / 1000);
    const pendentes = agenda(posicoes);
    const palco = palcoRef.current;
    let primeiro = false, nivel = -1, ultimoVol = 0;
    palco.dataset.nivel = "0";

    const quadro = () => {
      if (meu !== exec.current) return;
      const t = tempo();
      const p = limitar((t - INICIO_MUSICA) / (REFRAO_MUSICA - INICIO_MUSICA), 0, 1);
      // Só 5 níveis discretos no DOM (evita recalcular estilos a cada quadro).
      const n = Math.min(4, Math.floor(p * 5));
      if (n !== nivel) { nivel = n; palco.dataset.nivel = String(n); }
      if (usaAudio && t - ultimoVol > 0.1) { ultimoVol = t; audio.volume = limitar(volumeRef.current * (0.5 + 0.5 * p), 0, 1); }
      while (pendentes.length && t >= pendentes[0].em) {
        const { posicao } = pendentes.shift();
        setRevelados((r) => [...r, posicao]);
        estouroMenor(posicao);
      }
      if (!primeiro && t >= REFRAO_MUSICA) {
        primeiro = true;
        pendentes.splice(0).forEach(({ posicao }) => setRevelados((r) => [...r, posicao]));
        setRevelados((r) => [...r, 1]);
        palco.dataset.nivel = "0";
        if (usaAudio) audio.volume = volumeRef.current;
        setTerminou(true);
        explosaoOuro();
        return;
      }
      raf.current = requestAnimationFrame(quadro);
    };
    raf.current = requestAnimationFrame(quadro);
  }

  const iniciarRef = useRef(iniciar);
  iniciarRef.current = iniciar;
  useEffect(() => { if (autoStart && posicoes.length) iniciarRef.current(); }, []); // eslint-disable-line

  const campeao = grupos.find((g) => g.posicao === 1)?.itens.map((c) => c.nome).join(" e ") || "—";
  const legenda = !iniciado ? "" : terminou ? `Campeão: ${campeao}!`
    : revelados.length === 0 ? "A tensão começa… quem estará no pódio?"
    : revelados.length === 1 ? "Agora, quem leva a prata?" : "E o grande campeão é…";

  return (
    <div className={`podium-root ${abalo ? "abalo" : ""}`} ref={palcoRef} data-nivel="0">
      {iniciado && !terminou && <div className="podium-vinheta" aria-hidden="true" />}
      {flash && <div className="podium-flash" aria-hidden="true" />}
      <div className="row" style={{ justifyContent: "center" }}>
        <Button onClick={iniciar}>{iniciado ? "Repetir apresentação" : "Iniciar apresentação"}</Button>
        {audioSrc && !semAudio && (
          <>
            <Button variant="secondary" aria-pressed={mudo} onClick={() => setMudo((m) => !m)}>{mudo ? "Ativar som" : "Silenciar"}</Button>
            <label className="row podium-volume">
              <span>Volume</span>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume máximo da música" />
            </label>
          </>
        )}
      </div>
      {semAudio && <p className="muted" style={{ textAlign: "center" }}>Não foi possível tocar a música (o navegador bloqueou ou o arquivo não carregou). A apresentação segue sem som.</p>}
      <p className="podium-legenda" aria-live="polite">{legenda}</p>
      <div className={`podium-stage seq ${iniciado ? "started" : ""}`}>
        {grupos.map((g) => {
          const aberto = revelados.includes(g.posicao);
          return (
            <div key={g.posicao} className={`podium-col p${g.posicao} ${aberto ? "is-revealed" : ""}`}>
              {aberto && g.itens.length === 0 ? (
                <div className="podium-team vazio">
                  <div className="podium-avatar" aria-hidden="true">–</div>
                  <div className="podium-name">Sem classificado</div>
                </div>
              ) : aberto ? g.itens.map((c) => (
                <div key={c.id} className="podium-team">
                  <div className="podium-avatar" aria-hidden="true">{g.posicao === 1 ? <Icon name="trofeu" /> : iniciais(c.nome)}</div>
                  <div className="podium-name">{c.nome}</div>
                  <div className="podium-pts">{c.pontuacao != null ? Number(c.pontuacao).toFixed(2) : ""} <small>pts</small></div>
                </div>
              )) : <div className="podium-mystery" aria-label={`${g.posicao}º lugar ainda oculto`}>?</div>}
              <div className="podium-block">{g.posicao === 1 && <Icon name="ranking" />}<span>{g.posicao}º</span><small>{NOMES[g.posicao]}</small></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
