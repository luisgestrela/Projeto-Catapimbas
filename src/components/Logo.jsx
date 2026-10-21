import { Link } from "react-router-dom";
import Icon from "./Icon";
export default function Logo({ light = false, href }) {
  const conteudo = (
    <>
      <span className="logo-mark"><Icon name="ranking" /></span>
      <span>Avaliação de Startups</span>
    </>
  );
  const cls = `logo ${light ? "light" : ""}`.trim();
  return href ? <Link className={cls} to={href}>{conteudo}</Link> : <span className={cls}>{conteudo}</span>;
}
