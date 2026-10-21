import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";

// Ícone de cada destino do menu (pelo caminho). Itens sem correspondência ficam sem ícone.
const ICONES = {
  "/dashboard": "dashboard", "/projetos": "projetos", "/bancas": "bancas", "/aprovacoes": "aprovacoes",
  "/pessoas": "pessoas", "/criterios": "criterios", "/auditoria": "auditoria",
  "/instituicoes": "instituicoes", "/minhas-bancas": "avaliar",
};

export default function Sidebar({ id, items = [], currentPath, open = false, onClose }) {
  return (
    <aside id={id} className={`sidebar ${open ? "open" : ""}`} aria-label="Menu principal">
      <div className="brand"><Logo /></div>
      <nav className="sidebar-nav" aria-label="Navegação">
        {items.map((i) => (
<<<<<<< HEAD
          <NavLink key={i.href} to={i.href} viewTransition className="nav-item" onClick={onClose}
=======
          <NavLink key={i.href} to={i.href} className="nav-item" onClick={onClose}
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
            aria-current={currentPath === i.href || currentPath?.startsWith(i.href + "/") ? "page" : undefined}>
            {ICONES[i.href] && <Icon name={ICONES[i.href]} />}
            <span>{i.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
