import { PageHeader, Card, Badge, Button, DataTable } from "../../components";

export default function ResultadosPage({ banca = {}, ranking = [], notas = [], criterioDesempate, podeGerenciar = false, onExportar, onPublicar, onAbrirPodio }) {
  const publicado = banca.resultado === "publicado";
  const colunasRanking = [
    { key: "posicao", header: "Posição", render: (r) => `${r.posicao}º` },
    { key: "projeto", header: "Projeto" },
    { key: "pontuacao", header: "Pontuação", numeric: true, render: (r) => Number(r.pontuacao).toFixed(2) },
    { key: "avaliacoes", header: "Avaliações válidas" },
    { key: "empate", header: "", render: (r) => r.empatado && <Badge status="empate">Empate</Badge> },
  ];
  const colunasNotas = [
    { key: "projeto", header: "Projeto" },
    { key: "avaliador", header: "Avaliador" },
    { key: "criterio", header: "Critério" },
    { key: "nota", header: "Nota" },
  ];
  return (
    <>
      <PageHeader title={`Resultados — ${banca.nome || ""}`}
        subtitle={criterioDesempate ? `Desempate: ${criterioDesempate}` : undefined}
        actions={<>
          <Button variant="secondary" onClick={onExportar}>Exportar Excel</Button>
          <Button variant="secondary" onClick={onAbrirPodio} disabled={ranking.length === 0}>Ver pódio</Button>
          {podeGerenciar && !publicado && <Button onClick={onPublicar}>Publicar resultado</Button>}
        </>} />
      <Card title="Ranking" icon="ranking" actions={<Badge status={publicado ? "publicado" : "rascunho"} />}>
        {!publicado && <p className="muted">Resultado em rascunho: ainda não está visível ao público.</p>}
        <DataTable columns={colunasRanking} rows={ranking} rowKey="projetoId" emptyTitle="Ainda não há avaliações válidas" />
      </Card>
      <Card title="Notas lançadas">
        <DataTable columns={colunasNotas} rows={notas} emptyTitle="Nenhuma nota registrada" />
      </Card>
    </>
  );
}
