import { Link } from "react-router-dom";
<<<<<<< HEAD

// Texto que "rola" no hover (estilo Keyvo): o rótulo sobe e uma cópia entra por baixo.
function textoSimples(children) {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children) && children.every((c) => typeof c === "string" || typeof c === "number")) return children.join("");
  return null;
}

export default function Button({ variant = "primary", size, href, type = "button", className = "", children, ...props }) {
  const cls = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`.trim();
  const txt = textoSimples(children);
  const conteudo = txt !== null
    ? <span className="btn-roll"><span>{txt}</span><span aria-hidden="true">{txt}</span></span>
    : children;
  if (href?.startsWith("/")) return <Link className={cls} to={href} viewTransition {...props}>{conteudo}</Link>;
  if (href) return <a className={cls} href={href} {...props}>{conteudo}</a>;
  return <button type={type} className={cls} {...props}>{conteudo}</button>;
=======
export default function Button({ variant = "primary", size, href, type = "button", className = "", children, ...props }) {
  const cls = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`.trim();
  if (href?.startsWith("/")) return <Link className={cls} to={href} {...props}>{children}</Link>;
  if (href) return <a className={cls} href={href} {...props}>{children}</a>;
  return <button type={type} className={cls} {...props}>{children}</button>;
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
}
