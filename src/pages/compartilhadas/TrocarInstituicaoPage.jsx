import { PageHeader, Card, Badge, Button, EmptyState } from "../../components";

export default function TrocarInstituicaoPage({ vinculos = [], atualId, onEscolher }) {
  return (
    <>
      <PageHeader title="Escolher instituição" subtitle="Seu papel muda conforme a instituição selecionada." />
      {vinculos.length === 0 ? (
        <EmptyState title="Você ainda não tem vínculos ativos" />
      ) : (
        <div className="grid-2">
          {vinculos.map((v) => (
            <Card key={v.instituicaoId} title={v.instituicao} actions={<Badge tone="info">{v.papel}</Badge>}>
              <Button disabled={v.instituicaoId === atualId} onClick={() => onEscolher?.(v)}>
                {v.instituicaoId === atualId ? "Instituição atual" : "Entrar nesta instituição"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
