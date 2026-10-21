import { PageHeader, Card, Badge, DataTable, Button } from "../../components";

export default function ProjetoDetalhePage({ projeto = {}, podeEditar = false, onEditar, onVoltar }) {
  const colunas = [
    { key: "nome", header: "Nome" },
    { key: "funcao", header: "Função" },
    { key: "email", header: "E-mail" },
  ];
  return (
    <>
      <PageHeader title={projeto.nome || "Projeto"} subtitle={`${projeto.ano || ""}/${projeto.semestre || ""}`}
        actions={<><Button variant="secondary" onClick={onVoltar}>Voltar</Button>{podeEditar && <Button onClick={onEditar}>Editar</Button>}</>} />
      <Card title="Resumo" actions={<Badge status={projeto.status} />}>
        <p>{projeto.descricao || "Sem descrição."}</p>
        <p><strong>Orientador:</strong> {projeto.orientador || "—"}</p>
        <p><strong>Equipe:</strong> {projeto.equipe || "—"}</p>
      </Card>
      <Card title="Integrantes">
        <DataTable columns={colunas} rows={projeto.integrantes || []} emptyTitle="Nenhum integrante associado" />
      </Card>
    </>
  );
}
