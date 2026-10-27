import { useState } from "react";
import { AuthLayout, Button, Select } from "../../components";

export default function AcessoAvaliacaoPage({ acesso, erro, carregando = false, onEntrar }) {
  const [avaliadorId, setAvaliadorId] = useState("");
  const lista = acesso?.avaliadores || [];
  return (
    <AuthLayout
      title="Acesso à avaliação"
      subtitle={acesso?.projeto ? `Projeto: ${acesso.projeto.nome}` : "Confirme sua identidade para continuar."}
      footer={<>Este acesso é individual e temporário. Atualizar a página depois de entrar não invalida a sessão.</>}
    >
      {erro && <div className="alert" role="alert">{erro}</div>}
      {acesso ? (
        <form className="form" onSubmit={(e) => { e.preventDefault(); onEntrar?.(avaliadorId); }}>
          <p>Selecione o seu nome para abrir diretamente a avaliação deste projeto.</p>
          <Select label="Qual avaliador entrou neste link?" name="avaliador" placeholder="Selecione seu nome" value={avaliadorId} onChange={(e) => setAvaliadorId(e.target.value)} options={lista.map((a) => ({ value: a.id, label: a.nome }))} required />
          <div className="alert alert-info access-warning">Se seu nome não aparece aqui, você não foi cadastrado pelo sistema.</div>
          <Button type="submit" disabled={!avaliadorId || carregando}>{carregando ? "Abrindo avaliação…" : "Entrar e avaliar projeto"}</Button>
        </form>
      ) : !erro ? <p role="status">Validando link de avaliação…</p> : null}
    </AuthLayout>
  );
}
