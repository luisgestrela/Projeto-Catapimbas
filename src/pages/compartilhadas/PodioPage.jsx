import { PageHeader, Podium, Button, EmptyState } from "../../components";

export default function PodioPage({ banca = {}, colocados = [], audioSrc, onVoltar }) {
  return (
    <>
      <PageHeader title={`Pódio — ${banca.nome || ""}`} actions={<Button variant="secondary" onClick={onVoltar}>Voltar aos resultados</Button>} />
      {colocados.length === 0
        ? <EmptyState title="Sem classificação para exibir" description="Publique ou calcule o resultado da banca primeiro." />
        : <Podium colocados={colocados} audioSrc={audioSrc} />}
    </>
  );
}
