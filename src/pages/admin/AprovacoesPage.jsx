import { useState } from "react";
import { PageHeader, DataTable, Badge, Button, Modal, Textarea } from "../../components";

export default function AprovacoesPage({ solicitacoes = [], onAprovar, onRecusar }) {
  const [alvo, setAlvo] = useState(null);
  const [justificativa, setJustificativa] = useState("");

  function confirmarRecusa() {
    if (!justificativa.trim()) return;
    onRecusar?.(alvo, justificativa.trim());
    setAlvo(null);
    setJustificativa("");
  }

  const colunas = [
    { key: "nome", header: "Nome" },
    { key: "email", header: "E-mail" },
    { key: "papel", header: "Papel solicitado" },
    { key: "data", header: "Solicitado em" },
    { key: "status", header: "Status", render: (s) => <Badge status={s.status} /> },
    { key: "acoes", header: "Ações", render: (s) => s.status === "pendente" && (
      <div className="row">
        <Button size="sm" onClick={() => onAprovar?.(s)}>Aprovar</Button>
        <Button variant="danger" size="sm" onClick={() => setAlvo(s)}>Recusar</Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Aprovações" subtitle="Solicitações de ingresso na sua instituição." />
      <DataTable columns={colunas} rows={solicitacoes} emptyTitle="Nenhuma solicitação pendente"
        emptyDescription="Novos pedidos de acesso aparecerão aqui." />
      <Modal open={!!alvo} title={`Recusar ${alvo?.nome || ""}`} onClose={() => setAlvo(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setAlvo(null)}>Cancelar</Button>
          <Button variant="danger" disabled={!justificativa.trim()} onClick={confirmarRecusa}>Recusar solicitação</Button>
        </>}>
        <Textarea label="Justificativa (obrigatória)" name="justificativa" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
      </Modal>
    </>
  );
}
