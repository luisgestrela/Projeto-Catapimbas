import { useEffect, useRef, useState, Fragment } from "react";
import { useLocation } from "react-router-dom";

const reduzido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Título que entra palavra por palavra (estilo Keyvo): sobe, desfoca e ganha nitidez.
export function SplitText({ children, as: Tag = "span", delay = 0, step = 70, className = "" }) {
  const palavras = String(children).split(" ");
  return (
    <Tag className={`split ${className}`.trim()} aria-label={String(children)}>
      {palavras.map((p, i) => (
        <Fragment key={i}>
          <span className="split-w" aria-hidden="true"><span style={{ "--d": `${delay + i * step}ms` }}>{p}</span></span>{" "}
        </Fragment>
      ))}
    </Tag>
  );
}

// Número que conta de 0 até o valor quando a página abre.
export function CountUp({ value, duration = 900 }) {
  const n = Number(value);
  const numerico = value !== null && value !== "" && Number.isFinite(n);
  const [atual, setAtual] = useState(numerico && !reduzido() ? 0 : n);
  const ref = useRef(null);
  useEffect(() => {
    if (!numerico || reduzido()) { setAtual(n); return; }
    const casas = (String(value).split(".")[1] || "").length;
    let raf, t0;
    const passo = (t) => {
      t0 ??= t;
      const p = Math.min((t - t0) / duration, 1);
      setAtual(Number((n * (1 - Math.pow(1 - p, 4))).toFixed(casas)));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [n, numerico, value, duration]);
  if (!numerico) return <>{value ?? 0}</>;
  return <span ref={ref}>{atual}</span>;
}

// Efeitos globais de mouse e rolagem. Fica uma única vez na raiz do app.
export default function MotionRoot() {
  const barra = useRef(null);
  const { pathname } = useLocation();

  // Revela elementos [data-reveal] ao entrar na tela (re-escaneia a cada troca de página).
  useEffect(() => {
    document.documentElement.classList.add("js-motion");
    window.scrollTo({ top: 0, behavior: "instant" });
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    const id = requestAnimationFrame(() => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el)));
    return () => { cancelAnimationFrame(id); io.disconnect(); };
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let raf = 0, magnetico = null;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = root.scrollHeight - innerHeight;
        if (barra.current) barra.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
        root.classList.toggle("scrolled", scrollY > 24);
      });
    };

    const soltar = () => { if (magnetico) { magnetico.style.setProperty("--tx", "0px"); magnetico.style.setProperty("--ty", "0px"); magnetico = null; } };

    const onMove = (e) => {
      if (document.body.classList.contains("modo-palco")) return; // pódio em tela cheia: não competir com a animação
      if (document.querySelector(".kv")) { // brilho que segue o mouse só existe na landing
        root.style.setProperty("--px", `${e.clientX}px`);
        root.style.setProperty("--py", `${e.clientY}px`);
      }
      const alvo = e.target.closest?.(".card, .stat, .kv-card, .kv-steps li, .kv-mock, .podium-stage");
      if (alvo) {
        const r = alvo.getBoundingClientRect();
        alvo.style.setProperty("--mx", `${e.clientX - r.left}px`);
        alvo.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      if (reduzido()) return;
      // inclinação 3D suave do mock da landing
      const mock = e.target.closest?.(".kv-mock");
      if (mock) {
        const r = mock.getBoundingClientRect();
        mock.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - .5) * 5}deg`);
        mock.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - .5) * 4}deg`);
      }
      // botões "magnéticos" seguem o cursor de leve
      const btn = e.target.closest?.(".btn:not(:disabled)");
      if (btn !== magnetico) soltar();
      if (btn) {
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--tx", `${(e.clientX - r.left - r.width / 2) * .12}px`);
        btn.style.setProperty("--ty", `${(e.clientY - r.top - r.height / 2) * .22}px`);
        magnetico = btn;
      }
    };
    const onOut = (e) => {
      const mock = e.target.closest?.(".kv-mock");
      if (mock && !mock.contains(e.relatedTarget)) { mock.style.setProperty("--ry", "0deg"); mock.style.setProperty("--rx", "0deg"); }
    };

    // ondulação no clique dos botões
    const onDown = (e) => {
      const btn = e.target.closest?.(".btn:not(:disabled)");
      if (!btn || reduzido()) return;
      const r = btn.getBoundingClientRect();
      const s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
      btn.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    };

    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    document.addEventListener("pointerdown", onDown);
    if (fino) { document.addEventListener("pointermove", onMove, { passive: true }); document.addEventListener("pointerout", onOut); }
    return () => {
      removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove); document.removeEventListener("pointerout", onOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="scroll-progress" ref={barra} aria-hidden="true" />;
}
