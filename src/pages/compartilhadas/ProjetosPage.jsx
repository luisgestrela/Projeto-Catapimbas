import { useState } from "react";
import { MESES, formatarData } from "../../utils/filtroProjetos";
import { PageHeader, FilterBar, Input, Select, DataTable, Badge, Button, Pagination } from "../../components";

const VAZIO = { busca: "", nome: "", orientador: "", equipe: "", aluno: "", curso: "", ano: "", semestre: "", mes: "", dataInicio: "", dataFim: "", situacao: "", instituicaoId: "", ordenarPor: "nome" };

export default function ProjetosPage({ projetos = [], instituicoes, cursos = [], totalGeral = 0, titulo = "Projetos", subtitulo = "Consulte, filtre e acompanhe os projetos.", pagina = 1, totalPaginas = 1, podeCriar = false, onFiltrar, onPagina, onNovo, onAbrir, onExportar, totalFiltrado = 0 }) {
  const [f, setF] = useState(VAZIO);
  const [sel, setSel] = useState([]);
  const alternar = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const colunas = [
    { key: "sel", header: "", render: (p) => <input type="checkbox" aria-label={`Selecionar ${p.nome}`} checked={sel.includes(p.id)} onChange={() => alternar(p.id)} /> },
    { key: "nome", header: "Projeto", render: (p) => <button className="btn btn-ghost btn-sm" onClick={() => onAbrir?.(p)}>{p.nome}</button> },
    ...(instituicoes ? [{ key: "instituicao", header: "Instituição" }] : []),
    { key: "curso", header: "Curso", render: (p) => p.curso || "—" },
    { key: "orientador", header: "Orientador" },
    { key: "equipe", header: "Equipe" },
    { key: "periodo", header: "Período", render: (p) => `${p.ano}/${p.semestre}${p.dataRealizacao ? ` · ${formatarData(p.dataRealizacao)}` : ""}` },
    { key: "status", header: "Situação", render: (p) => <Badge status={p.status} /> },
  ];
  return (
    <>
      <PageHeader title={titulo} subtitle={subtitulo} actions={<>
        <Button variant="secondary" onClick={() => onExportar?.(sel)} disabled={totalFiltrado === 0}>
          {sel.length ? `Exportar Excel (${sel.length} selecionados)` : `Exportar Excel (${totalFiltrado} filtrados)`}
        </Button>
        {podeCriar && <Button onClick={onNovo}>Novo projeto</Button>}
      </>} />
      <FilterBar onSubmit={() => onFiltrar?.(f)} onClear={() => { setF(VAZIO); onFiltrar?.(VAZIO); }}>
        <Input label="Buscar" name="busca" type="search" placeholder="Nome, curso, orientador, equipe, aluno…" value={f.busca} onChange={set("busca")} />
        <Select label="Curso" name="curso" placeholder="Todos" value={f.curso} onChange={set("curso")} options={cursos.map((c) => ({ value: c, label: c }))} />
        <Select label="Visão" name="situacao" placeholder="Todos os projetos" value={f.situacao} onChange={set("situacao")}
          options={[{ value: "ativo", label: "Ativos" }, { value: "anteriores", label: "Anteriores (inspiração)" }, { value: "arquivado", label: "Arquivados" }]} />
        <Input label="Ano" name="ano" type="number" value={f.ano} onChange={set("ano")} />
        <Select label="Mês" name="mes" placeholder="Todos" value={f.mes} onChange={set("mes")}
          options={MESES.map((m, i) => ({ value: String(i + 1), label: m }))} />
        <Select label="Semestre" name="semestre" placeholder="Todos" value={f.semestre} onChange={set("semestre")}
          options={[{ value: "1", label: "1º" }, { value: "2", label: "2º" }]} />
        <Input label="Data inicial" name="dataInicio" type="date" value={f.dataInicio} onChange={set("dataInicio")} />
        <Input label="Data final" name="dataFim" type="date" value={f.dataFim} onChange={set("dataFim")} />
        <Input label="Orientador" name="orientador" value={f.orientador} onChange={set("orientador")} />
        <Input label="Equipe" name="equipe" value={f.equipe} onChange={set("equipe")} />
        <Input label="Aluno" name="aluno" value={f.aluno} onChange={set("aluno")} />
        {instituicoes && (
          <Select label="Instituição" name="instituicaoId" placeholder="Todas" value={f.instituicaoId} onChange={set("instituicaoId")}
            options={instituicoes.map((i) => ({ value: i.id, label: i.nome }))} />
        )}
        <Select label="Ordenar por" name="ordenarPor" value={f.ordenarPor} onChange={set("ordenarPor")}
          options={[{ value: "nome", label: "Nome" }, { value: "data", label: "Data (mais recentes)" }, { value: "ano", label: "Ano" }, { value: "status", label: "Situação" }]} />
      </FilterBar>
      <p className="muted" role="status">{totalFiltrado === totalGeral ? `${totalGeral} projeto(s)` : `${totalFiltrado} de ${totalGeral} projeto(s)`}</p>
      <DataTable columns={colunas} rows={projetos} emptyTitle="Nenhum projeto encontrado" emptyDescription="Tente outros filtros ou cadastre um novo projeto." />
      <Pagination page={pagina} totalPages={totalPaginas} onChange={onPagina} />
    </>
  );
}
