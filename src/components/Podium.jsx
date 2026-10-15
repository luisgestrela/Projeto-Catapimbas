import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Button from "./Button";
import Icon from "./Icon";

const NOMES = { 1: "Ouro", 2: "Prata", 3: "Bronze" };

export default function Podium({ colocados = [], audioSrc }) {
  const audioRef = useRef(null);
  const timer = useRef(null);
  const [iniciado, setIniciado] = useState(false);
  const [mudo, setMudo] = useState(false);
  const [rodada, setRodada] = useState(0);

  useEffect(() => () => { clearInterval(timer.current); audioRef.current?.pause(); }, []);

  function iniciar() {
    setIniciado(true);
    setRodada((r) => r + 1);
    clearInterval(timer.current);
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduzido) {
      let n = 0;
      timer.current = setInterval(() => {
        confetti({ particleCount: 70, spread: 75, origin: { x: Math.random(), y: 0.25 } });
        if (++n >= 8) clearInterval(timer.current);
      }, 400);
    }
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }

  // Ordem visual: prata, ouro, bronze. Empates compartilham a mesma posição.
  const grupos = [2, 1, 3]
    .map((p) => ({ posicao: p, itens: colocados.filter((c) => c.posicao === p) }))
    .filter((g) => g.itens.length > 0);

  return (
    <div>
      <div className="row" style={{ justifyContent: "center" }}>
        <Button onClick={iniciar}>{iniciado ? "Repetir animação" : "Iniciar apresentação"}</Button>
        {audioSrc && (
          <Button variant="secondary" aria-pressed={mudo} onClick={() => setMudo((m) => !m)}>
            {mudo ? "Ativar som" : "Silenciar"}
          </Button>
        )}
      </div>
      {audioSrc && <audio ref={audioRef} src={audioSrc} muted={mudo} />}
      <div className={`podium-stage ${iniciado ? "revealed" : ""}`} key={rodada} aria-live="polite">
        {grupos.map((g) => (
          <div key={g.posicao} className={`podium-col p${g.posicao}`}>
            {g.itens.map((c) => (
              <div key={c.id}>
                <div className="podium-name">{c.nome}</div>
                <div className="muted">{c.pontuacao != null ? Number(c.pontuacao).toFixed(2) : ""} pts</div>
              </div>
            ))}
            <div className="podium-block">{g.posicao === 1 && <Icon name="ranking" />}<span>{g.posicao}º</span><small>{NOMES[g.posicao]}</small></div>
          </div>
        ))}
      </div>
    </div>
  );
}
