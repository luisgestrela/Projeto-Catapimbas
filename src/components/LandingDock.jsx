import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import Logo from "./Logo";

const ITENS = [
  { id: "topo", label: "Início", icon: "ranking", home: true },
  { id: "recursos", label: "Recursos", icon: "criterios" },
  { id: "como-funciona", label: "Como funciona", icon: "avaliar" },
];
const RAIO = 22, CIRC = 2 * Math.PI * RAIO;

// Navegação da landing: dock flutuante na lateral esquerda (na base, em telas estreitas). Os ícones crescem conforme o
// mouse se aproxima, a seção visível fica marcada e o ícone de início mostra o progresso da rolagem.
export default function LandingDock() {
  const [ativo, setAtivo] = useState("topo");
  const dock = useRef(null);
  const anel = useRef(null);

  // scroll-spy
  useEffect(() => {
    const vistas = new Set();
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? vistas.add(e.target.id) : vistas.delete(e.target.id)));
      setAtivo(ITENS.slice().reverse().find((i) => vistas.has(i.id))?.id ?? null);
    }, { rootMargin: "-40% 0px -50% 0px" });
    ITENS.forEach((i) => { const el = document.getElementById(i.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  // anel de progresso
  useEffect(() => {
    let raf;
    const atualizar = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        anel.current?.style.setProperty("stroke-dashoffset", String(CIRC * (1 - (max > 0 ? scrollY / max : 0))));
      });
    };
    atualizar();
    addEventListener("scroll", atualizar, { passive: true });
    return () => { removeEventListener("scroll", atualizar); cancelAnimationFrame(raf); };
  }, []);

  // magnificação estilo macOS (só com mouse e sem "reduzir movimento")
  useEffect(() => {
    const el = dock.current;
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let raf;
    const itens = () => [...el.querySelectorAll("[data-mag]")];
    const mover = (e) => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      cancelAnimationFrame(raf);
      const vertical = getComputedStyle(el).flexDirection === "column";
      raf = requestAnimationFrame(() => itens().forEach((it) => {
        const r = it.getBoundingClientRect();
        const d = vertical ? Math.abs(e.clientY - (r.top + r.height / 2)) : Math.abs(e.clientX - (r.left + r.width / 2));
        it.style.setProperty("--s", (1 + .22 * Math.exp(-(d * d) / (2 * 50 * 50))).toFixed(3));
      }));
    };
    const sair = () => { cancelAnimationFrame(raf); itens().forEach((it) => it.style.setProperty("--s", "1")); };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    return () => { el.removeEventListener("pointermove", mover); el.removeEventListener("pointerleave", sair); cancelAnimationFrame(raf); };
  }, []);

  const subir = () => scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <div className="kv-brand"><Logo href="/" /></div>
      <nav className="kv-dock" ref={dock} aria-label="Principal">
        {ITENS.map((i) => {
          const comum = { className: "kv-dock-item", "data-mag": true, "data-on": ativo === i.id, "aria-label": i.label,
            "aria-current": ativo === i.id ? "location" : undefined };
          const corpo = (
            <>
              <span className="kv-dock-tip" aria-hidden="true">{i.label}</span>
              <span className="kv-dock-ico">
                {i.home && (
                  <svg className="kv-ring" viewBox="0 0 48 48" aria-hidden="true">
                    <circle cx="24" cy="24" r={RAIO} />
                    <circle ref={anel} cx="24" cy="24" r={RAIO} strokeDasharray={CIRC} strokeDashoffset={CIRC} />
                  </svg>
                )}
                <Icon name={i.icon} />
              </span>
            </>
          );
          return i.home
            ? <button key={i.id} type="button" onClick={subir} {...comum}>{corpo}</button>
            : <a key={i.id} href={`#${i.id}`} {...comum}>{corpo}</a>;
        })}
        <span className="kv-dock-sep" aria-hidden="true" />
        <Link to="/login" viewTransition className="kv-dock-item" data-mag aria-label="Entrar">
          <span className="kv-dock-tip" aria-hidden="true">Entrar</span>
          <span className="kv-dock-ico"><Icon name="pessoas" /></span>
        </Link>
        <Link to="/cadastro" viewTransition className="kv-dock-item kv-dock-cta" data-mag aria-label="Solicitar acesso">
          <span className="kv-dock-tip" aria-hidden="true">Solicitar acesso</span>
          <span className="kv-dock-ico"><Icon name="aprovacoes" /></span>
        </Link>
      </nav>
    </>
  );
}
