import { PageHeader, Card, Badge, Button, EmptyState } from "../../components";

export default function MinhasBancasPage({ bancas = [], onAbrir }) {
  return (
    <>
      <PageHeader title="Minhas bancas" subtitle="Bancas em que você foi designado como avaliador." />
      {bancas.length === 0 ? (
        <EmptyState title="Nenhuma banca atribuída" description="Quando um coordenador designar você, a banca aparecerá aqui." />
      ) : (
        <div className="grid-2">
          {bancas.map((b) => (
            <Card key={b.id} title={b.nome} actions={<Badge status={b.status} />}>
              <p className="muted">{b.periodo}</p>
              <p>{b.avaliados ?? 0} de {b.totalProjetos ?? 0} projetos avaliados por você</p>
              <Button disabled={b.status !== "aberta"} onClick={() => onAbrir?.(b)}>
                {b.status === "aberta" ? "Avaliar projetos" : "Banca encerrada"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
