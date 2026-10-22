import { useEffect, useId, useRef } from "react";

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, title, onClose, children, footer }) {
  const ref = useRef(null);
  const fechar = useRef(onClose);
  const tituloId = useId();
  fechar.current = onClose; // sempre a versão mais recente, sem reiniciar o efeito a cada digitação

  useEffect(() => {
    if (!open) return;
    const anterior = document.activeElement;
    // Foca o primeiro campo do formulário (se houver); senão, a própria janela.
    const campo = ref.current?.querySelector("input:not([type=hidden]), textarea, select");
    (campo || ref.current)?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") return fechar.current?.();
      if (e.key !== "Tab" || !ref.current) return;
      const itens = [...ref.current.querySelectorAll(FOCAVEIS)];
      if (itens.length === 0) return;
      const primeiro = itens[0], ultimo = itens[itens.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === ref.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); anterior?.focus?.(); };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={() => fechar.current?.()}>
      <div className="modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={tituloId} onClick={(e) => e.stopPropagation()}>
        <h2 id={tituloId}>{title}</h2>
        {children}
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}
