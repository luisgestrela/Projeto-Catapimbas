import { useState } from "react";
import { PageHeader, FilterBar, Input, Select, DataTable, Pagination } from "../../components";

const OPERACOES = [
  { value: "aprovacao", label: "Aprovação de usuário" },
  { value: "nota", label: "Alteração de nota" },
  { value: "permissao", label: "Mudança de permissão" },
  { value: "projeto", label: "Projeto" },
  { value: "banca", label: "Banca" },
  { value: "criterio", label: "Critério" },
  { value: "instituicao", label: "Instituição" },
];

export default function AuditoriaPage({ registros = [], pagina = 1, totalPaginas = 1, onFiltrar, onPagina }) {
  const [f, setF] = useState({ ator: "", operacao: "", de: "", ate: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const colunas = [
    { key: "data", header: "Data" },
    { key: "ator", header: "Ator" },
    { key: "operacao", header: "Operação" },
    { key: "entidade", header: "Entidade" },
    { key: "detalhes", header: "Alterações" },
  ];
  return (
    <>
      <PageHeader title="Auditoria" subtitle="Histórico de operações relevantes da instituição." />
      <FilterBar onSubmit={() => onFiltrar?.(f)} onClear={() => { const v = { ator: "", operacao: "", de: "", ate: "" }; setF(v); onFiltrar?.(v); }}>
        <Input label="Ator" name="ator" value={f.ator} onChange={set("ator")} />
        <Select label="Operação" name="operacao" placeholder="Todas" value={f.operacao} onChange={set("operacao")} options={OPERACOES} />
        <Input label="De" name="de" type="date" value={f.de} onChange={set("de")} />
        <Input label="Até" name="ate" type="date" value={f.ate} onChange={set("ate")} />
      </FilterBar>
      <DataTable columns={colunas} rows={registros} emptyTitle="Nenhum registro no período" />
      <Pagination page={pagina} totalPages={totalPaginas} onChange={onPagina} />
    </>
  );
}
