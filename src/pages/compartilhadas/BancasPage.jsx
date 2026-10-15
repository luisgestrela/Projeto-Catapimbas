import { PageHeader, DataTable, Badge, Button } from "../../components";

export default function BancasPage({ bancas = [], podeCriar = false, onNova, onAbrir }) {
  const colunas = [
    { key: "nome", header: "Banca", render: (b) => <button className="btn btn-ghost btn-sm" onClick={() => onAbrir?.(b)}>{b.nome}</button> },
    { key: "periodo", header: "Período" },
    { key: "projetos", header: "Projetos" },
    { key: "avaliadores", header: "Avaliadores" },
    { key: "status", header: "Status", render: (b) => <Badge status={b.status} /> },
  ];
  return (
    <>
      <PageHeader title="Bancas" subtitle="Eventos de avaliação da instituição." actions={podeCriar && <Button onClick={onNova}>Nova banca</Button>} />
      <DataTable columns={colunas} rows={bancas} emptyTitle="Nenhuma banca cadastrada" emptyDescription="Crie uma banca para começar a avaliar projetos." />
    </>
  );
}
