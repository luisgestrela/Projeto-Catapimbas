import { PageHeader, Card, Badge, DataTable, Button, Progresso } from "../../components";

// Situação de cada projeto na banca: quantas das avaliações previstas (uma por avaliador designado) já foram enviadas.
function SituacaoProjeto({ recebidas = 0, previstas = 0 }) {
  if (previstas === 0) return <Badge tone="neutral">Sem avaliadores</Badge>;
  if (recebidas >= previstas) return <Badge tone="success">Avaliado</Badge>;
  if (recebidas > 0) return <Badge tone="info">Parcial</Badge>;
  return <Badge tone="warning">Pendente</Badge>;
}

export default function BancaDetalhePage({ banca = {}, podeEditar = false, onEditar, onVerResultados, onVoltar }) {
  const projetos = banca.projetos || [];
  const previstasTotal = projetos.reduce((s, p) => s + (p.previstas ?? 0), 0);
  const recebidasTotal = projetos.reduce((s, p) => s + Math.min(p.recebidas ?? 0, p.previstas ?? 0), 0);
  const completos = projetos.filter((p) => (p.previstas ?? 0) > 0 && (p.recebidas ?? 0) >= p.previstas).length;
  return (
    <>
      <PageHeader title={banca.nome || "Banca"} subtitle={banca.periodo}
        actions={<>
          <Button variant="secondary" onClick={onVoltar}>Voltar</Button>
          <Button variant="secondary" onClick={onVerResultados}>Ver resultados</Button>
          {podeEditar && <Button onClick={onEditar}>Editar</Button>}
        </>} />
      <Card title="Situação">
        <div className="avaliacao-resumo">
          <div className="row">
            <Badge status={banca.status} />
            <span className="muted">{completos} de {projetos.length} {projetos.length === 1 ? "projeto totalmente avaliado" : "projetos totalmente avaliados"}</span>
          </div>
          <Progresso feitos={recebidasTotal} total={previstasTotal} rotulo="Avaliações recebidas na banca" />
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>{recebidasTotal} de {previstasTotal} avaliações previstas já foram enviadas.</p>
      </Card>
      <div className="grid-2">
        <Card title="Projetos participantes">
          <DataTable columns={[
            { key: "nome", header: "Projeto" },
            { key: "equipe", header: "Equipe" },
            { key: "avaliacoes", header: "Avaliações", render: (p) => `${p.recebidas ?? 0}/${p.previstas ?? 0}` },
            { key: "situacao", header: "Situação", render: (p) => <SituacaoProjeto recebidas={p.recebidas} previstas={p.previstas} /> },
          ]} rows={projetos} emptyTitle="Nenhum projeto na banca" />
        </Card>
        <Card title="Avaliadores">
          <DataTable columns={[
            { key: "nome", header: "Avaliador" },
            { key: "progresso", header: "Progresso", render: (a) => `${a.avaliados ?? 0}/${a.total ?? 0}` },
            { key: "situacao", header: "Situação", render: (a) => ((a.avaliados ?? 0) >= (a.total ?? 0) && (a.total ?? 0) > 0
              ? <Badge tone="success">Concluído</Badge>
              : <Badge tone="warning">{Math.max(0, (a.total ?? 0) - (a.avaliados ?? 0))} pendente(s)</Badge>) },
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
