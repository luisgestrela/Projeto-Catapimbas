import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
export default function AppLayout({ menuItems, currentPath, instituicao, usuario, onSair, onTrocarInstituicao, children }) {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto]);
  return (
    <div className="app">
      <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
      <Sidebar id="menu-principal" items={menuItems} currentPath={currentPath} open={aberto} onClose={() => setAberto(false)} />
      {aberto && <button type="button" className="scrim" aria-label="Fechar menu" onClick={() => setAberto(false)} />}
      <div className="app-main">
        <Header instituicao={instituicao} usuario={usuario} onSair={onSair} onTrocarInstituicao={onTrocarInstituicao}
          onMenu={() => setAberto((v) => !v)} menuAberto={aberto} menuId="menu-principal" />
        <main className="content" id="conteudo" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
