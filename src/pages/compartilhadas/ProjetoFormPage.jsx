import { useState } from "react";
import { PageHeader, Card, Input, Textarea, Select, Button } from "../../components";

// Formulário de projeto. Cada aluno e orientador aparece com a universidade a que está vinculado.
// `instituicoes` só é enviado ao superadmin cadastrando pela plataforma: ele escolhe a universidade e a lista de pessoas acompanha.
export default function ProjetoFormPage({ inicial = {}, orientadores = [], alunos = [], instituicoes, instituicaoPadrao = "", erros = {}, cursos = [], onSubmit, onCancelar }) {
  const [f, setF] = useState({
    nome: inicial.nome || "", descricao: inicial.descricao || "", status: inicial.status || "ativo",
    ano: inicial.ano || new Date().getFullYear(), semestre: inicial.semestre || "1",
    curso: inicial.curso || "", dataRealizacao: inicial.dataRealizacao || new Date().toISOString().slice(0, 10),
    orientadorId: inicial.orientadorId || "", equipe: inicial.equipe || "", alunosIds: inicial.alunosIds || [],
    instituicaoId: String(inicial.instituicaoId || instituicaoPadrao || ""),
  });
  const [busca, setBusca] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const alternarAluno = (id) =>
    setF({ ...f, alunosIds: f.alunosIds.includes(id) ? f.alunosIds.filter((a) => a !== id) : [...f.alunosIds, id] });

  const escolheInstituicao = !!instituicoes;
  const editando = !!inicial.id;
  const daInstituicao = (p) => !escolheInstituicao || String(p.instituicaoId) === f.instituicaoId;
  const alunosLista = alunos.filter(daInstituicao).filter((a) => !busca.trim() || a.nome.toLowerCase().includes(busca.trim().toLowerCase()));
  const orientadoresLista = orientadores.filter(daInstituicao);
  const semInstituicao = escolheInstituicao && !f.instituicaoId;

  return (
    <>
      <PageHeader title={editando ? "Editar projeto" : "Novo projeto"} />
      <Card>
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit?.(f); }}>
          {escolheInstituicao && (
            <Select label="Universidade / instituição" name="instituicaoId" placeholder="Selecione" value={f.instituicaoId} disabled={editando}
              options={instituicoes.map((i) => ({ value: String(i.id), label: i.nome }))} error={erros.instituicaoId}
              hint={editando ? "A instituição de um projeto não muda." : "Os orientadores e alunos listados abaixo são os vinculados a esta instituição."}
              onChange={(e) => setF({ ...f, instituicaoId: e.target.value, orientadorId: "", alunosIds: [] })} required />
          )}
          <Input label="Nome do projeto/startup" name="nome" value={f.nome} onChange={set("nome")} error={erros.nome} required />
          <Textarea label="Descrição" name="descricao" value={f.descricao} onChange={set("descricao")} error={erros.descricao} />
          <div className="grid-4">
            <Input label="Ano" name="ano" type="number" value={f.ano} onChange={set("ano")} required />
            <Select label="Semestre" name="semestre" value={f.semestre} onChange={set("semestre")} options={[{ value: "1", label: "1º" }, { value: "2", label: "2º" }]} />
            <Select label="Situação" name="status" value={f.status} onChange={set("status")}
              options={[{ value: "ativo", label: "Ativo" }, { value: "arquivado", label: "Arquivado" }]} />
          </div>
          <div className="grid-4">
            <Input label="Curso" name="curso" list="lista-cursos" value={f.curso} onChange={set("curso")} error={erros.curso} hint="Ex.: DS (Desenvolvimento de Sistemas)." />
            <Input label="Data de realização" name="dataRealizacao" type="date" value={f.dataRealizacao} onChange={set("dataRealizacao")} error={erros.dataRealizacao} />
          </div>
          <datalist id="lista-cursos">{cursos.map((c) => <option key={c} value={c} />)}</datalist>
          <Input label="Nome da equipe" name="equipe" value={f.equipe} onChange={set("equipe")} />
          <Select label="Orientador" name="orientadorId" placeholder={semInstituicao ? "Escolha a instituição primeiro" : "Selecione"} value={f.orientadorId} onChange={set("orientadorId")}
            disabled={semInstituicao} options={orientadoresLista.map((o) => ({ value: o.id, label: o.instituicao ? `${o.nome} — ${o.instituicao}` : o.nome }))} />
          <fieldset>
            <legend><strong>Integrantes (alunos)</strong></legend>
            {semInstituicao && <p className="muted">Escolha a instituição para ver os alunos vinculados a ela.</p>}
            {!semInstituicao && alunos.filter(daInstituicao).length > 6 && (
              <Input label="Buscar aluno" name="busca-aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
            )}
            {!semInstituicao && alunosLista.length === 0 && (
              <p className="muted">{busca ? "Nenhum aluno com esse nome." : "Nenhum aluno aprovado nesta instituição. Aprove os pedidos de acesso na aba Aprovações."}</p>
            )}
            {!semInstituicao && alunosLista.length > 0 && (
              <div className="check-lista">
                {alunosLista.map((a) => (
                  <label key={a.id} className="check">
                    <input type="checkbox" checked={f.alunosIds.includes(a.id)} onChange={() => alternarAluno(a.id)} />
                    <span>{a.nome}{a.instituicao && <span className="pessoa-inst"> — {a.instituicao}</span>}</span>
                  </label>
                ))}
              </div>
            )}
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
