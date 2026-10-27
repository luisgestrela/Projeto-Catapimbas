import { useState } from "react";
import { PageHeader, DataTable, Badge, Button, Select, Card, Input } from "../../components";

const PAPEIS = [
  { value: "administrador", label: "Administrador institucional" },
  { value: "coordenador", label: "Coordenador" },
  { value: "orientador", label: "Orientador" },
  { value: "avaliador", label: "Avaliador" },
  { value: "aluno", label: "Aluno" },
];

// Papéis que o administrador pode cadastrar diretamente, já com acesso liberado.
const PAPEIS_CADASTRO = [
  { value: "aluno", label: "Aluno" },
  { value: "avaliador", label: "Avaliador" },
];

const inicial = { nome: "", email: "", senha: "", papel: "aluno" };

export default function PessoasPermissoesPage({ vinculos = [], onCadastrar, onCadastrarAvaliador, onAlterarPapel, onBloquear, onRevogar }) {
  const [form, setForm] = useState(inicial);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const set = (campo) => (e) => setForm((atual) => ({ ...atual, [campo]: e.target.value }));
  const cadastro = onCadastrar || onCadastrarAvaliador;

  async function cadastrar(e) {
    e.preventDefault();
    setErro(""); setSucesso(""); setSalvando(true);
    const r = await cadastro?.(form);
    setSalvando(false);
    if (r?.erro) return setErro(r.erro);
    const rotulo = PAPEIS_CADASTRO.find((p) => p.value === form.papel)?.label.toLowerCase() || "pessoa";
    setSucesso(`${form.nome.trim() || "Pessoa"} foi cadastrado(a) como ${rotulo} e já pode acessar a instituição.`);
    // Mantém o papel escolhido: quem cadastra uma turma de alunos não precisa trocá-lo a cada pessoa.
    setForm({ ...inicial, papel: form.papel });
  }

  const colunas = [
    { key: "nome", header: "Nome" },
    { key: "email", header: "E-mail" },
    { key: "papel", header: "Papel", render: (v) => (
      <Select aria-label={`Papel de ${v.nome}`} name={`papel-${v.id}`} value={v.papel} options={PAPEIS}
        onChange={(e) => onAlterarPapel?.(v, e.target.value)} />
    ) },
    { key: "situacao", header: "Situação", render: (v) => <Badge status={v.situacao} /> },
    { key: "acoes", header: "Ações", render: (v) => (
      <div className="row">
        {v.situacao === "bloqueado"
          ? <Button size="sm" onClick={() => onBloquear?.(v, false)}>Desbloquear</Button>
          : <Button variant="secondary" size="sm" onClick={() => onBloquear?.(v, true)}>Bloquear</Button>}
        <Button variant="danger" size="sm" onClick={() => onRevogar?.(v)}>Revogar acesso</Button>
      </div>
    ) },
  ];
  return (
    <>
      <PageHeader title="Pessoas e permissões" subtitle="Papéis valem apenas para a instituição atual." />
      <Card title="Cadastrar aluno ou avaliador">
        <p className="muted">Crie o acesso diretamente. A pessoa já poderá entrar com este e-mail e senha, sem precisar solicitar cadastro ou aguardar aprovação. Alunos cadastrados aqui já ficam disponíveis para serem vinculados a projetos.</p>
        <form className="form evaluator-form" onSubmit={cadastrar}>
          {erro && <div className="alert" role="alert">{erro}</div>}
          {sucesso && <div className="alert alert-ok" role="status">{sucesso}</div>}
          <div className="grid-2">
            <Select label="Tipo de acesso" name="papel-cadastro" value={form.papel} onChange={set("papel")} options={PAPEIS_CADASTRO} />
            <Input label="Nome completo" name="nome" value={form.nome} onChange={set("nome")} minLength="2" maxLength="120" required />
          </div>
          <div className="grid-2">
            <Input label="E-mail de acesso" name="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} required />
            <Input label="Senha inicial" name="senha" type="password" autoComplete="new-password" value={form.senha} onChange={set("senha")} minLength="8" maxLength="72" required hint="Use no mínimo 8 caracteres." />
          </div>
          <div className="row evaluator-form-actions">
            <Button type="submit" disabled={salvando}>{salvando ? "Cadastrando…" : `Cadastrar ${form.papel === "aluno" ? "aluno" : "avaliador"}`}</Button>
          </div>
        </form>
      </Card>
      <DataTable columns={colunas} rows={vinculos} emptyTitle="Nenhuma pessoa vinculada" />
    </>
  );
}
