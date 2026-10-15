import { useState } from "react";
import { PageHeader, Card, Input, Textarea, Select, Button } from "../../components";

export default function ProjetoFormPage({ inicial = {}, orientadores = [], alunos = [], erros = {}, onSubmit, onCancelar }) {
  const [f, setF] = useState({
    nome: inicial.nome || "", descricao: inicial.descricao || "", status: inicial.status || "ativo",
    ano: inicial.ano || new Date().getFullYear(), semestre: inicial.semestre || "1",
    orientadorId: inicial.orientadorId || "", equipe: inicial.equipe || "", alunosIds: inicial.alunosIds || [],
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const alternarAluno = (id) =>
    setF({ ...f, alunosIds: f.alunosIds.includes(id) ? f.alunosIds.filter((a) => a !== id) : [...f.alunosIds, id] });

  return (
    <>
      <PageHeader title={inicial.id ? "Editar projeto" : "Novo projeto"} />
      <Card>
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit?.(f); }}>
          <Input label="Nome do projeto/startup" name="nome" value={f.nome} onChange={set("nome")} error={erros.nome} required />
          <Textarea label="Descrição" name="descricao" value={f.descricao} onChange={set("descricao")} error={erros.descricao} />
          <div className="grid-4">
            <Input label="Ano" name="ano" type="number" value={f.ano} onChange={set("ano")} required />
            <Select label="Semestre" name="semestre" value={f.semestre} onChange={set("semestre")} options={[{ value: "1", label: "1º" }, { value: "2", label: "2º" }]} />
            <Select label="Situação" name="status" value={f.status} onChange={set("status")}
              options={[{ value: "ativo", label: "Ativo" }, { value: "arquivado", label: "Arquivado" }]} />
          </div>
          <Input label="Nome da equipe" name="equipe" value={f.equipe} onChange={set("equipe")} />
          <Select label="Orientador" name="orientadorId" placeholder="Selecione" value={f.orientadorId} onChange={set("orientadorId")}
            options={orientadores.map((o) => ({ value: o.id, label: o.nome }))} />
          <fieldset>
            <legend><strong>Integrantes (alunos)</strong></legend>
            {alunos.length === 0 && <p className="muted">Nenhum aluno disponível.</p>}
            {alunos.map((a) => (
              <label key={a.id} className="check">
                <input type="checkbox" checked={f.alunosIds.includes(a.id)} onChange={() => alternarAluno(a.id)} /> {a.nome}
              </label>
            ))}
          </fieldset>
          <div className="row">
            <Button type="submit">Salvar projeto</Button>
            <Button variant="secondary" onClick={onCancelar}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
