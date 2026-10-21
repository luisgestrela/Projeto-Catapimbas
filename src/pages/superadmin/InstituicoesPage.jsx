import { PageHeader, DataTable, Badge, Button } from "../../components";

export default function InstituicoesPage({ instituicoes = [], onNova, onEditar, onAlterarStatus }) {
  const colunas = [
    { key: "nome", header: "Nome" },
    { key: "identificador", header: "Identificador" },
    { key: "status", header: "Status", render: (i) => <Badge status={i.status} /> },
    { key: "acoes", header: "Ações", render: (i) => (
      <div className="row">
        <Button variant="secondary" size="sm" onClick={() => onEditar?.(i)}>Editar</Button>
        {i.status === "ativa"
          ? <Button variant="danger" size="sm" onClick={() => onAlterarStatus?.(i, "suspensa")}>Suspender</Button>
          : <Button size="sm" onClick={() => onAlterarStatus?.(i, "ativa")}>Ativar</Button>}
      </div>
    ) },
  ];
  return (
    <>
      <PageHeader title="Instituições" subtitle="Crie, ative e suspenda instituições da plataforma."
        actions={<Button onClick={onNova}>Nova instituição</Button>} />
      <DataTable columns={colunas} rows={instituicoes} emptyTitle="Nenhuma instituição cadastrada"
        emptyDescription="Cadastre a primeira instituição para começar." />
    </>
  );
}
