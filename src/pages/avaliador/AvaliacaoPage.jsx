import { useState } from "react";
import { PageHeader, Card, Select, RatingInput, Button, Modal } from "../../components";

export default function AvaliacaoPage({ banca = {}, projetos = [], criterios = [], projetoInicialId = "", erro, onSubmit }) {
  const [projetoId, setProjetoId] = useState(projetoInicialId ? String(projetoInicialId) : "");
  const [notas, setNotas] = useState({});
  const [confirmando, setConfirmando] = useState(false);

  const projeto = projetos.find((p) => String(p.id) === String(projetoId));
  const completo = projeto && criterios.length > 0 && criterios.every((c) => notas[c.id]);

  function trocarProjeto(e) {
    setProjetoId(e.target.value);
    setNotas({});
  }

  return (
    <>
      <PageHeader title={banca.nome || "Avaliação"} subtitle="Cada projeto só pode ser avaliado uma vez por avaliador nesta banca." />
      {erro && <div className="alert" role="alert">{erro}</div>}
      <Card>
        <Select label="Projeto" name="projeto" placeholder="Selecione o projeto" value={projetoId} onChange={trocarProjeto}
          options={projetos.map((p) => ({ value: p.id, label: p.jaAvaliado ? `${p.nome} (já avaliado)` : p.nome }))} />
      </Card>
      {projeto?.jaAvaliado && <div className="alert">Você já enviou a avaliação deste projeto. Para corrigir, solicite uma edição ao coordenador.</div>}
      {projeto && !projeto.jaAvaliado && (
        <div className="stack">
          {criterios.map((c) => (
            <RatingInput key={c.id} label={c.titulo} descricao={c.descricao} descritores={c.descritores}
              min={c.escala?.min} max={c.escala?.max} value={notas[c.id]} onChange={(n) => setNotas({ ...notas, [c.id]: n })} />
          ))}
          <div className="row">
            <Button disabled={!completo} onClick={() => setConfirmando(true)}>Revisar e enviar</Button>
            {!completo && <span className="field-hint">Atribua nota a todos os critérios.</span>}
          </div>
        </div>
      )}
      <Modal open={confirmando} title="Confirmar envio" onClose={() => setConfirmando(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setConfirmando(false)}>Voltar</Button>
          <Button onClick={() => { onSubmit?.({ projetoId, notas }); setConfirmando(false); }}>Enviar avaliação</Button>
        </>}>
        <p>Projeto: <strong>{projeto?.nome}</strong></p>
        <ul>{criterios.map((c) => <li key={c.id}>{c.titulo}: <strong>{notas[c.id]}</strong></li>)}</ul>
        <p className="muted">Depois do envio, alterações exigem edição autorizada e ficam registradas na auditoria.</p>
      </Modal>
    </>
  );
}
