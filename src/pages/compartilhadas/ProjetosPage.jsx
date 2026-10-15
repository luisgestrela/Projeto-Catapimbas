import { useState } from "react";
import { PageHeader, FilterBar, Input, Select, DataTable, Badge, Button, Pagination } from "../../components";

const VAZIO = { nome: "", orientador: "", equipe: "", aluno: "", ano: "", semestre: "", instituicaoId: "", ordenarPor: "nome" };

export default function ProjetosPage({ projetos = [], instituicoes, pagina = 1, totalPaginas = 1, podeCriar = false, onFiltrar, onPagina, onNovo, onAbrir }) {
  const [f, setF] = useState(VAZIO);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const colunas = [
    { key: "nome", header: "Projeto", render: (p) => <button className="btn btn-ghost btn-sm" onClick={() => onAbrir?.(p)}>{p.nome}</button> },
    { key: "orientador", header: "Orientador" },
    { key: "equipe", header: "Equipe" },
    { key: "periodo", header: "Período", render: (p) => `${p.ano}/${p.semestre}` },
    { key: "status", header: "Situação", render: (p) => <Badge status={p.status} /> },
  ];
  return (
    <>
      <PageHeader title="Projetos" subtitle="Consulte, filtre e acompanhe os projetos." actions={podeCriar && <Button onClick={onNovo}>Novo projeto</Button>} />
      <FilterBar onSubmit={() => onFiltrar?.(f)} onClear={() => { setF(VAZIO); onFiltrar?.(VAZIO); }}>
        <Input label="Nome" name="nome" value={f.nome} onChange={set("nome")} />
        <Input label="Orientador" name="orientador" value={f.orientador} onChange={set("orientador")} />
        <Input label="Equipe" name="equipe" value={f.equipe} onChange={set("equipe")} />
        <Input label="Aluno" name="aluno" value={f.aluno} onChange={set("aluno")} />
        <Input label="Ano" name="ano" type="number" value={f.ano} onChange={set("ano")} />
        <Select label="Semestre" name="semestre" placeholder="Todos" value={f.semestre} onChange={set("semestre")}
          options={[{ value: "1", label: "1º" }, { value: "2", label: "2º" }]} />
        {instituicoes && (
          <Select label="Instituição" name="instituicaoId" placeholder="Todas" value={f.instituicaoId} onChange={set("instituicaoId")}
            options={instituicoes.map((i) => ({ value: i.id, label: i.nome }))} />
        )}
        <Select label="Ordenar por" name="ordenarPor" value={f.ordenarPor} onChange={set("ordenarPor")}
          options={[{ value: "nome", label: "Nome" }, { value: "ano", label: "Ano" }, { value: "status", label: "Situação" }]} />
      </FilterBar>
      <DataTable columns={colunas} rows={projetos} emptyTitle="Nenhum projeto encontrado" emptyDescription="Tente outros filtros ou cadastre um novo projeto." />
      <Pagination page={pagina} totalPages={totalPaginas} onChange={onPagina} />
    </>
  );
}
