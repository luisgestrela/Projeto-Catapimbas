import { PageHeader, Card, Badge, Button, EmptyState, Progresso } from "../../components";

export default function MinhasBancasPage({ bancas = [], onAbrir }) {
  return (
    <>
      <PageHeader title="Minhas bancas" subtitle="Bancas em que você foi designado como avaliador." />
      {bancas.length === 0 ? (
        <EmptyState title="Nenhuma banca atribuída" description="Quando um coordenador designar você, a banca aparecerá aqui." />
      ) : (
        <div className="grid-2">
          {bancas.map((b) => {
            const total = b.totalProjetos ?? 0;
            const feitos = b.avaliados ?? 0;
            const pendentes = Math.max(0, total - feitos);
            return (
              <Card key={b.id} title={b.nome} actions={<Badge status={b.status} />}>
                <p className="muted">{b.periodo}</p>
                <div className="row">
                  <Badge tone="success">{feitos} {feitos === 1 ? "avaliado" : "avaliados"}</Badge>
                  <Badge tone={pendentes > 0 ? "warning" : "neutral"}>{pendentes} {pendentes === 1 ? "pendente" : "pendentes"}</Badge>
                </div>
                <Progresso feitos={feitos} total={total} rotulo={`Projetos avaliados por você em ${b.nome}`} />
                <p>{feitos} de {total} projetos avaliados por você</p>
                <Button disabled={b.status !== "aberta"} onClick={() => onAbrir?.(b)}>
                  {b.status === "aberta" ? (pendentes === 0 ? "Revisar projetos" : "Avaliar projetos") : "Banca encerrada"}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
