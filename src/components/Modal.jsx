import { useEffect, useRef } from "react";
export default function Modal({ open, title, onClose, children, footer }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const anterior = document.activeElement;
    ref.current?.focus();
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); anterior?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-titulo">{title}</h2>
        {children}
        {footer && <div className="modal-actions">{footer}</div>}
      </div>
    </div>
  );
}
