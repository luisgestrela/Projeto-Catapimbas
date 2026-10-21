import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout, Input, Button } from "../../components";

export default function RecuperarSenhaPage({ onSubmit, enviado = false }) {
  const [email, setEmail] = useState("");
  return (
    <AuthLayout title="Recuperar senha" subtitle="Enviaremos um link para redefinir sua senha." footer={<Link to="/login">Voltar para o login</Link>}>
      {enviado ? (
        <div className="alert alert-ok">Se o e-mail estiver cadastrado, você receberá as instruções em instantes.</div>
      ) : (
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit?.(email); }}>
          <Input label="E-mail" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit">Enviar link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
