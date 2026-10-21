<<<<<<< HEAD
import { PageHeader, Card, Badge, Button, DataTable, StatCard, ChartCard } from "../../components";

const MEDALHA = { 1: "Ouro", 2: "Prata", 3: "Bronze" };

export default function ResultadosPage({ banca = {}, ranking = [], notas = [], criterioDesempate, podeGerenciar = false, onExportar, onEditarNota, onPublicar, onAbrirPodio }) {
  const publicado = banca.resultado === "publicado";
  const max = ranking.length ? Math.max(...ranking.map((r) => Number(r.pontuacao))) : 0;
  const lider = ranking[0];
  const segundo = ranking.find((r) => r.posicao > 1);
  const diferenca = lider && segundo ? (Number(lider.pontuacao) - Number(segundo.pontuacao)).toFixed(2) : "—";
  const dadosGrafico = ranking.slice(0, 8).map((r) => ({ nome: r.projeto, valor: Number(Number(r.pontuacao).toFixed(2)) }));
  const colunasRanking = [
    { key: "posicao", header: "Posição", render: (r) => (
      <span className={`rank-pos ${r.posicao <= 3 ? `rank-p${r.posicao}` : ""}`}>
        {r.posicao}º{r.posicao <= 3 && <small>{MEDALHA[r.posicao]}</small>}
      </span>
    ) },
    { key: "projeto", header: "Projeto", render: (r) => <strong>{r.projeto}</strong> },
    { key: "pontuacao", header: "Pontuação", render: (r) => (
      <div className="score-cell">
        <span className="score-num">{Number(r.pontuacao).toFixed(2)}</span>
        <span className="score-bar" aria-hidden="true"><i style={{ width: `${max ? (Number(r.pontuacao) / max) * 100 : 0}%` }} /></span>
      </div>
    ) },
=======
import { PageHeader, Card, Badge, Button, DataTable } from "../../components";

export default function ResultadosPage({ banca = {}, ranking = [], notas = [], criterioDesempate, podeGerenciar = false, onExportar, onPublicar, onAbrirPodio }) {
  const publicado = banca.resultado === "publicado";
  const colunasRanking = [
    { key: "posicao", header: "Posição", render: (r) => `${r.posicao}º` },
    { key: "projeto", header: "Projeto" },
    { key: "pontuacao", header: "Pontuação", numeric: true, render: (r) => Number(r.pontuacao).toFixed(2) },
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
    { key: "avaliacoes", header: "Avaliações válidas" },
    { key: "empate", header: "", render: (r) => r.empatado && <Badge status="empate">Empate</Badge> },
  ];
  const colunasNotas = [
    { key: "projeto", header: "Projeto" },
    { key: "avaliador", header: "Avaliador" },
    { key: "criterio", header: "Critério" },
    { key: "nota", header: "Nota" },
<<<<<<< HEAD
    ...(podeGerenciar ? [{ key: "acoes", header: "", render: (n) => <Button variant="secondary" size="sm" onClick={() => onEditarNota?.(n)}>Corrigir</Button> }] : []),
=======
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
  ];
  return (
    <>
      <PageHeader title={`Resultados — ${banca.nome || ""}`}
        subtitle={criterioDesempate ? `Desempate: ${criterioDesempate}` : undefined}
        actions={<>
<<<<<<< HEAD
          <Button variant="secondary" onClick={onExportar}>Exportar Excel (.xlsx)</Button>
          <Button variant="secondary" onClick={onAbrirPodio} disabled={ranking.length === 0}>Ver pódio</Button>
          {podeGerenciar && !publicado && <Button onClick={onPublicar}>Publicar resultado</Button>}
        </>} />
      <div className="grid-4">
        <StatCard icon="trofeu" tone="gold" label="Equipe campeã" value={lider?.projeto || "—"} hint="1º lugar da banca" />
        <StatCard icon="alvo" label="Maior pontuação" value={lider ? Number(lider.pontuacao).toFixed(2) : "—"} hint="Média ponderada" />
        <StatCard icon="diferenca" tone="ok" label="Vantagem sobre o 2º" value={diferenca} hint="Pontos de diferença" />
        <StatCard icon="equipes" tone="warn" label="Equipes avaliadas" value={ranking.length} hint="Com avaliações válidas" />
      </div>
      <Card title="Ranking" icon="ranking" actions={<Badge status={publicado ? "publicado" : "rascunho"} />}>
        {!publicado && <p className="muted">Resultado em rascunho: ainda não está visível ao público.</p>}
        <p className="chart-desc">A pontuação é a média ponderada das notas por critério. Em caso de empate, vale a maior nota no critério de maior peso.</p>
        <DataTable columns={colunasRanking} rows={ranking} rowKey="projetoId" emptyTitle="Ainda não há avaliações válidas" />
      </Card>
      {dadosGrafico.length > 0 && (
        <ChartCard title="Pontuação por equipe" description="Comparação das maiores pontuações. Ouro, prata e bronze marcam o pódio." type="bar" data={dadosGrafico} highlightTop />
      )}
      <Card title="Notas lançadas">
        <DataTable columns={colunasNotas} rows={notas} rowKey="chave" emptyTitle="Nenhuma nota registrada" />
=======
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
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
      </Card>
    </>
  );
}
