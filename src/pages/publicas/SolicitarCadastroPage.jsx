import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout, Input, Select, Button } from "../../components";

const PAPEIS = [
  { value: "aluno", label: "Aluno" },
  { value: "orientador", label: "Orientador" },
  { value: "avaliador", label: "Avaliador" },
  { value: "coordenador", label: "Coordenador" },
];

export default function SolicitarCadastroPage({ instituicoes = [], onSubmit, erro, enviado = false }) {
  const [f, setF] = useState({ nome: "", email: "", senha: "", confirmacao: "", instituicaoId: "", papel: "aluno" });
  const [erroLocal, setErroLocal] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function enviar(e) {
    e.preventDefault();
    if (f.senha.length < 8) return setErroLocal("A senha deve ter pelo menos 8 caracteres.");
    if (f.senha !== f.confirmacao) return setErroLocal("A confirmação não confere com a senha.");
    setErroLocal("");
    const { confirmacao: _confirmacao, ...dados } = f;
    onSubmit?.(dados);
  }

  if (enviado) {
    return (
      <AuthLayout title="Solicitação enviada">
        <div className="alert alert-ok">Sua solicitação está pendente. Você poderá entrar após a aprovação do administrador da instituição.</div>
        <p><Link to="/login">Voltar para o login</Link></p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Solicitar acesso" subtitle="O administrador da instituição analisará seu pedido." footer={<>Já tem conta? <Link to="/login">Entrar</Link></>}>
      <form className="form" onSubmit={enviar}>
        {(erro || erroLocal) && <div className="alert" role="alert">{erro || erroLocal}</div>}
        <Input label="Nome completo" name="nome" value={f.nome} onChange={set("nome")} required />
        <Input label="E-mail" name="email" type="email" value={f.email} onChange={set("email")} required />
        <Select label="Instituição" name="instituicaoId" placeholder="Selecione" value={f.instituicaoId} onChange={set("instituicaoId")}
          options={instituicoes.map((i) => ({ value: i.id, label: i.nome }))} required />
        <Select label="Papel desejado" name="papel" value={f.papel} onChange={set("papel")} options={PAPEIS} />
        <Input label="Senha" name="senha" type="password" autoComplete="new-password" value={f.senha} onChange={set("senha")} hint="Mínimo de 8 caracteres." required />
        <Input label="Confirmar senha" name="confirmacao" type="password" autoComplete="new-password" value={f.confirmacao} onChange={set("confirmacao")} required />
        <Button type="submit">Enviar solicitação</Button>
      </form>
    </AuthLayout>
  );
}
