import { useState } from "react";
import { PageHeader, FilterBar, Select, Input, StatCard, ChartCard } from "../../components";

export default function DashboardPage({ indicadores = {}, porPeriodo = [], porStatus = [], filtros = {}, onFiltrar }) {
  const [f, setF] = useState({ ano: filtros.ano || "", semestre: filtros.semestre || "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral dos projetos e avaliações." />
      <FilterBar onSubmit={() => onFiltrar?.(f)} onClear={() => { setF({ ano: "", semestre: "" }); onFiltrar?.({ ano: "", semestre: "" }); }}>
        <Input label="Ano" name="ano" type="number" min="2000" value={f.ano} onChange={set("ano")} />
        <Select label="Semestre" name="semestre" placeholder="Todos" value={f.semestre} onChange={set("semestre")}
          options={[{ value: "1", label: "1º semestre" }, { value: "2", label: "2º semestre" }]} />
      </FilterBar>
      <div className="grid-4">
        <StatCard label="Projetos" value={indicadores.projetos} />
        <StatCard label="Bancas" value={indicadores.bancas} />
        <StatCard label="Avaliações concluídas" value={indicadores.avaliacoesConcluidas} />
        <StatCard label="Avaliações pendentes" value={indicadores.avaliacoesPendentes} />
      </div>
      <div className="grid-2">
        <ChartCard title="Projetos por período" type="bar" data={porPeriodo} />
        <ChartCard title="Projetos por status" type="pie" data={porStatus} />
      </div>
    </>
  );
}
