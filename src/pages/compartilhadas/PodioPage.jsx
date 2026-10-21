<<<<<<< HEAD
import { useEffect, useState } from "react";
import { PageHeader, Podium, Button, EmptyState } from "../../components";

import { MUSICA } from "../../utils/musica";
let saidaTela = 0; // evita sair/entrar da tela cheia no duplo efeito do StrictMode

export default function PodioPage({ banca = {}, colocados = [], audioSrc = MUSICA, autoPalco = false, onVoltar }) {
  const vazio = colocados.length === 0;
  const [palco, setPalco] = useState(autoPalco && !vazio);

  // Modo palco: cobre a tela inteira (sem menu), pede tela cheia ao navegador e fecha com Esc.
  useEffect(() => {
    if (!palco) return;
    clearTimeout(saidaTela);
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    const onKey = (e) => e.key === "Escape" && setPalco(false);
    const onFs = () => { if (!document.fullscreenElement) setPalco(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    document.body.style.overflow = "hidden";
    document.body.classList.add("modo-palco");
    return () => {
      document.body.classList.remove("modo-palco");
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      document.body.style.overflow = "";
      saidaTela = setTimeout(() => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); }, 50);
    };
  }, [palco]);

  if (palco) {
    return (
      <div className="podio-palco" role="dialog" aria-modal="true" aria-label={`Pódio — ${banca.nome || ""}`}>
        <button type="button" className="btn btn-secondary podio-sair" onClick={() => setPalco(false)}>Sair da tela cheia (Esc)</button>
        <h1>{banca.nome}</h1>
        <p className="podio-sub">Pódio oficial</p>
        <Podium colocados={colocados} audioSrc={audioSrc} autoStart />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={`Pódio — ${banca.nome || ""}`} actions={<>
        <Button variant="secondary" onClick={onVoltar}>Voltar aos resultados</Button>
        <Button onClick={() => setPalco(true)} disabled={vazio}>Abrir em tela cheia</Button>
      </>} />
      {vazio
=======
import { PageHeader, Podium, Button, EmptyState } from "../../components";

export default function PodioPage({ banca = {}, colocados = [], audioSrc, onVoltar }) {
  return (
    <>
      <PageHeader title={`Pódio — ${banca.nome || ""}`} actions={<Button variant="secondary" onClick={onVoltar}>Voltar aos resultados</Button>} />
      {colocados.length === 0
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
        ? <EmptyState title="Sem classificação para exibir" description="Publique ou calcule o resultado da banca primeiro." />
        : <Podium colocados={colocados} audioSrc={audioSrc} />}
    </>
  );
}
