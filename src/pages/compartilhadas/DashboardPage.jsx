import { useState } from "react";
import { PageHeader, FilterBar, Select, Input, StatCard, ChartCard, Card, DataTable, Button, Badge } from "../../components";

const VAZIO = { ano: "", semestre: "", curso: "", bancaId: "" };

export default function DashboardPage({
  indicadores = {}, porPeriodo = [], porStatus = [], porAvaliacao = [], porBanca = [], ranking = [], bancaRanking = null,
  cursos = [], bancas = [], filtros = VAZIO, onFiltrar, onAbrirProjeto, onVerRanking,
}) {
  const [f, setF] = useState({ ...VAZIO, ...filtros });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const colunasBancas = [
    { key: "nome", header: "Edição / banca" },
    { key: "concluidas", header: "Concluídas" },
    { key: "pendentes", header: "Pendentes" },
    { key: "previstas", header: "Previstas" },
  ];
  const colunasRanking = [
    { key: "posicao", header: "Posição", render: (r) => `${r.posicao}º` },
    { key: "projeto", header: "Projeto", render: (r) => <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAbrirProjeto?.(r.projetoId)}>{r.projeto}</button> },
    { key: "pontuacao", header: "Pontuação", render: (r) => Number(r.pontuacao).toFixed(2) },
    { key: "avaliacoes", header: "Avaliações" },
    { key: "empate", header: "", render: (r) => r.empatado && <Badge status="empate">Empate</Badge> },
  ];
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral dos projetos, das avaliações e da classificação." />
      <FilterBar onSubmit={() => onFiltrar?.(f)} onClear={() => { setF(VAZIO); onFiltrar?.(VAZIO); }}>
        <Input label="Ano" name="ano" type="number" min="2000" value={f.ano} onChange={set("ano")} />
        <Select label="Semestre" name="semestre" placeholder="Todos" value={f.semestre} onChange={set("semestre")}
          options={[{ value: "1", label: "1º semestre" }, { value: "2", label: "2º semestre" }]} />
        <Select label="Curso" name="curso" placeholder="Todos" value={f.curso} onChange={set("curso")} options={cursos.map((c) => ({ value: c, label: c }))} />
        <Select label="Edição do evento" name="bancaId" placeholder="Todas" value={f.bancaId} onChange={set("bancaId")} options={bancas.map((b) => ({ value: String(b.id), label: b.nome }))} />
      </FilterBar>
      <div className="grid-4">
        <StatCard icon="projetos" label="Projetos cadastrados" value={indicadores.projetos} hint="Equipes no filtro atual" />
        <StatCard icon="trofeu" label="Projetos avaliados" value={indicadores.projetosAvaliados} hint="Com ao menos uma avaliação" tone="gold" />
        <StatCard icon="aprovacoes" label="Avaliações concluídas" value={indicadores.avaliacoesConcluidas} hint="Salvas no sistema" tone="ok" />
        <StatCard icon="auditoria" label="Avaliações pendentes" value={indicadores.avaliacoesPendentes} hint="Em bancas abertas" tone="warn" />
      </div>
      <div className="grid-2">
        <ChartCard title="Situação das avaliações" description="Concluídas e pendentes nas bancas do filtro." type="pie" data={porAvaliacao} />
        <ChartCard title="Projetos por período" description="Quantas equipes participaram em cada semestre." type="bar" data={porPeriodo} />
      </div>
      <div className="grid-2">
        <Card title="Andamento por edição">
          <DataTable columns={colunasBancas} rows={porBanca} emptyTitle="Nenhuma banca no filtro" />
        </Card>
        <ChartCard title="Projetos por status" description="Proporção de projetos ativos e arquivados." type="pie" data={porStatus} />
      </div>
      <Card title={bancaRanking ? `Classificação — ${bancaRanking.nome}` : "Classificação"}
        actions={bancaRanking && <Button variant="secondary" size="sm" onClick={() => onVerRanking?.(bancaRanking.id)}>Ver ranking completo</Button>}>
        <DataTable columns={colunasRanking} rows={ranking.slice(0, 5)} rowKey="projetoId" emptyTitle="Ainda não há avaliações para classificar" />
      </Card>
    </>
  );
}
