import Button from "./Button";
import Icon from "./Icon";
export default function Header({ instituicao, usuario, onMenu, menuAberto = false, menuId, onSair, onTrocarInstituicao }) {
  return (
    <header className="topbar">
      <div className="row">
        <Button variant="secondary" size="sm" className="menu-btn" onClick={onMenu}
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"} aria-expanded={menuAberto} aria-controls={menuId}>
          <Icon name={menuAberto ? "fechar" : "menu"} />
        </Button>
        {instituicao && <strong>{instituicao}</strong>}
        {onTrocarInstituicao && <Button variant="ghost" size="sm" onClick={onTrocarInstituicao}>Trocar instituição</Button>}
      </div>
      <div className="row">
        {usuario && (
          <div className="user">
            <span className="avatar" aria-hidden="true">{usuario.nome?.[0]?.toUpperCase()}</span>
            <span className="user-name"><strong>{usuario.nome}</strong>{usuario.papel && <span>{usuario.papel}</span>}</span>
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={onSair}>Sair</Button>
      </div>
    </header>
  );
}
