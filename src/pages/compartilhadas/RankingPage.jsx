import { useState } from "react";
import { PageHeader, FilterBar, Select, Input, Card, Badge, Button, DataTable, StatCard } from "../../components";

const MEDALHA = { 1: "Ouro", 2: "Prata", 3: "Bronze" };
const VAZIO = { ano: "", semestre: "", curso: "" };

export default function RankingPage({
  bancas = [], bancaId = "", banca = null, linhas = [], semAvaliacao = 0, previstas = 0, cursos = [], filtros = VAZIO, criterioDesempate,
  onTrocarBanca, onFiltrar, onAbrirProjeto, onAbrirResultados,
}) {
  const [f, setF] = useState({ ...VAZIO, ...filtros });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const max = linhas.length ? Math.max(...linhas.map((r) => r.pontuacao)) : 0;
  const colunas = [
    { key: "posicao", header: "Posição", render: (r) => (
      <span className={`rank-pos ${r.posicao <= 3 ? `rank-p${r.posicao}` : ""}`}>
        {r.posicao}º{r.posicao <= 3 && <small>{MEDALHA[r.posicao]}</small>}
      </span>
    ) },
    { key: "projeto", header: "Projeto", render: (r) => <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAbrirProjeto?.(r.projetoId)}>{r.projeto}</button> },
    { key: "curso", header: "Curso", render: (r) => r.curso || "—" },
    { key: "periodo", header: "Período" },
    { key: "pontuacao", header: "Pontuação", render: (r) => (
      <div className="score-cell">
        <span className="score-num">{r.pontuacao.toFixed(2)}</span>
        <span className="score-bar" aria-hidden="true"><i style={{ width: `${max ? (r.pontuacao / max) * 100 : 0}%` }} /></span>
      </div>
    ) },
    { key: "avaliacoes", header: "Avaliações", render: (r) => `${r.avaliacoes} de ${previstas}` },
    { key: "empate", header: "", render: (r) => r.empatado && <Badge status="empate">Empate</Badge> },
  ];
  const publicado = banca?.resultado === "publicado";
  return (
    <>
      <PageHeader title="Ranking" subtitle={criterioDesempate ? `Média ponderada das avaliações. Desempate: ${criterioDesempate}.` : undefined}
        actions={banca && <Button variant="secondary" onClick={() => onAbrirResultados?.(banca.id)}>Resultados da banca</Button>} />
      <FilterBar onSubmit={() => onFiltrar?.(f)} onClear={() => { setF(VAZIO); onFiltrar?.(VAZIO); }}>
        <Select label="Edição do evento" name="bancaId" value={bancaId} onChange={(e) => onTrocarBanca?.(e.target.value)} options={bancas.map((b) => ({ value: String(b.id), label: b.nome }))} />
        <Select label="Curso" name="curso" placeholder="Todos" value={f.curso} onChange={set("curso")} options={cursos.map((c) => ({ value: c, label: c }))} />
        <Input label="Ano" name="ano" type="number" min="2000" value={f.ano} onChange={set("ano")} />
        <Select label="Semestre" name="semestre" placeholder="Todos" value={f.semestre} onChange={set("semestre")}
          options={[{ value: "1", label: "1º semestre" }, { value: "2", label: "2º semestre" }]} />
      </FilterBar>
      <div className="grid-4">
        <StatCard icon="trofeu" tone="gold" label="Líder" value={linhas[0]?.projeto || "—"} hint="1º lugar no filtro atual" />
        <StatCard icon="equipes" label="Projetos classificados" value={linhas.length} hint="Com avaliações válidas" />
        <StatCard icon="auditoria" tone="warn" label="Sem avaliação" value={semAvaliacao} hint="Ainda aguardando nota" />
      </div>
      <Card title={banca ? banca.nome : "Classificação"} icon="ranking" actions={banca && <Badge status={publicado ? "publicado" : "rascunho"} />}>
        <DataTable columns={colunas} rows={linhas} rowKey="projetoId" emptyTitle="Ainda não há avaliações válidas" emptyDescription="Ajuste os filtros ou aguarde o envio das avaliações." />
      </Card>
    </>
  );
}
