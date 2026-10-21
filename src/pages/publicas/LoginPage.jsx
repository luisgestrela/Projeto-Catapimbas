import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout, Input, Button } from "../../components";

export default function LoginPage({ onSubmit, erro, carregando = false, dica }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  return (
    <AuthLayout
      title="Entrar"
      subtitle="Use o e-mail e a senha cadastrados."
      footer={<>Ainda não tem conta? <Link to="/cadastro">Solicite acesso</Link></>}
    >
      <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit?.({ email, senha }); }}>
        {erro && <div className="alert" role="alert">{erro}</div>}
        {dica}
        <Input label="E-mail" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Senha" name="senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <Button type="submit" disabled={carregando}>{carregando ? "Entrando..." : "Entrar"}</Button>
        <Link to="/recuperar-senha">Esqueci minha senha</Link>
      </form>
    </AuthLayout>
  );
}
