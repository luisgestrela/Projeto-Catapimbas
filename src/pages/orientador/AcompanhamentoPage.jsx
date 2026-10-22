import { PageHeader, Card, Badge, Button, EmptyState, StatCard } from "../../components";

// Acompanhamento do orientador: projetos vinculados a ele e os integrantes de cada equipe (somente leitura).
export default function AcompanhamentoPage({ nome = "", instituicao, projetos = [], onAbrir }) {
  const primeiroNome = nome.split(" ")[0];
  const ativos = projetos.filter((p) => p.status === "ativo").length;
  const integrantes = new Set(projetos.flatMap((p) => p.integrantes.map((i) => i.id))).size;
  const emBanca = projetos.filter((p) => p.bancas.length > 0).length;
  return (
    <>
      <PageHeader title={`Olá, ${primeiroNome || "orientador"}!`}
        subtitle={instituicao ? `Projetos que você orienta em ${instituicao}.` : "Projetos que você orienta."} />
      <div className="grid-4">
        <StatCard icon="projetos" label="Projetos orientados" value={projetos.length} hint={`${ativos} ativos`} />
        <StatCard icon="equipes" label="Integrantes" value={integrantes} hint="Alunos nas suas equipes" tone="ok" />
        <StatCard icon="bancas" label="Em bancas" value={emBanca} hint="Projetos já inscritos em banca" tone="gold" />
      </div>
      {projetos.length === 0 ? (
        <EmptyState title="Nenhum projeto vinculado a você" description="Quando a administração ou a coordenação vincular um projeto ao seu nome, ele aparece aqui com a equipe." />
      ) : projetos.map((p) => (
        <Card key={p.id} title={p.nome} actions={<><Badge status={p.status} /><Button size="sm" variant="secondary" onClick={() => onAbrir?.(p)}>Detalhes</Button></>}>
          <p className="muted">{p.periodo}{p.equipe ? ` · Equipe ${p.equipe}` : ""}</p>
          {p.descricao && <p>{p.descricao}</p>}
          <h3>Integrantes</h3>
          {p.integrantes.length === 0 ? <p className="muted">Nenhum aluno associado a este projeto.</p> : (
            <ul className="lista-simples">
              {p.integrantes.map((i) => (
                <li key={i.id} className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{i.nome}</strong><span className="muted">{i.email || "—"}</span>
                </li>
              ))}
            </ul>
          )}
          <h3>Participação em bancas</h3>
          {p.bancas.length === 0 ? <p className="muted">Este projeto ainda não está em nenhuma banca.</p> : (
            <ul className="lista-simples">
              {p.bancas.map((b) => (
                <li key={b.id} className="row" style={{ justifyContent: "space-between" }}>
                  <span><strong>{b.nome}</strong> <span className="muted">{b.periodo}</span></span>
                  <span><Badge status={b.status} /> {b.resultado === "publicado" && <Badge status="publicado">Resultado publicado</Badge>}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </>
  );
}
