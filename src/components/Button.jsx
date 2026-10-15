import { Link } from "react-router-dom";
export default function Button({ variant = "primary", size, href, type = "button", className = "", children, ...props }) {
  const cls = `btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`.trim();
  if (href?.startsWith("/")) return <Link className={cls} to={href} {...props}>{children}</Link>;
  if (href) return <a className={cls} href={href} {...props}>{children}</a>;
  return <button type={type} className={cls} {...props}>{children}</button>;
}
