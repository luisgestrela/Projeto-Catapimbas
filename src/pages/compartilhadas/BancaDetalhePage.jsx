import { PageHeader, Card, Badge, DataTable, Button } from "../../components";

export default function BancaDetalhePage({ banca = {}, podeEditar = false, onEditar, onVerResultados, onVoltar }) {
  return (
    <>
      <PageHeader title={banca.nome || "Banca"} subtitle={banca.periodo}
        actions={<>
          <Button variant="secondary" onClick={onVoltar}>Voltar</Button>
          <Button variant="secondary" onClick={onVerResultados}>Ver resultados</Button>
          {podeEditar && <Button onClick={onEditar}>Editar</Button>}
        </>} />
      <Card title="Situação"><Badge status={banca.status} /></Card>
      <div className="grid-2">
        <Card title="Projetos participantes">
          <DataTable columns={[{ key: "nome", header: "Projeto" }, { key: "equipe", header: "Equipe" }]} rows={banca.projetos || []} emptyTitle="Nenhum projeto na banca" />
        </Card>
        <Card title="Avaliadores">
          <DataTable columns={[
            { key: "nome", header: "Avaliador" },
            { key: "progresso", header: "Progresso", render: (a) => `${a.avaliados ?? 0}/${a.total ?? 0}` },
          ]} rows={banca.avaliadores || []} emptyTitle="Nenhum avaliador designado" />
        </Card>
      </div>
      <Card title="Critérios e pesos">
        <DataTable columns={[
          { key: "titulo", header: "Critério" },
          { key: "peso", header: "Peso" },
          { key: "escala", header: "Escala", render: (c) => `${c.escala?.min} a ${c.escala?.max}` },
        ]} rows={banca.criterios || []} emptyTitle="Nenhum critério configurado" />
      </Card>
    </>
  );
}
