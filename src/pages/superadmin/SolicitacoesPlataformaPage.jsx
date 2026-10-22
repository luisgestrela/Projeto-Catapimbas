import { useState } from "react";
import { PageHeader, DataTable, Badge, Button, Modal, Select, Textarea } from "../../components";

// Solicitações de ingresso de todas as instituições (visão do superadmin).
export default function SolicitacoesPlataformaPage({ solicitacoes = [], onAprovar, onRecusar }) {
  const [alvo, setAlvo] = useState(null);
  const [justificativa, setJustificativa] = useState("");
  const [instituicaoId, setInstituicaoId] = useState("");

  const instituicoes = [...new Map(solicitacoes.map((s) => [s.instituicaoId, s.instituicao]))]
    .map(([value, label]) => ({ value: String(value), label }));
  const linhas = solicitacoes
    .filter((s) => !instituicaoId || String(s.instituicaoId) === instituicaoId)
    .sort((a, b) => (a.situacao === "pendente" ? 0 : 1) - (b.situacao === "pendente" ? 0 : 1));

  function confirmarRecusa() {
    if (!justificativa.trim()) return;
    onRecusar?.(alvo, justificativa.trim());
    setAlvo(null);
    setJustificativa("");
  }

  const colunas = [
    { key: "instituicao", header: "Instituição" },
    { key: "nome", header: "Nome" },
    { key: "email", header: "E-mail" },
    { key: "papelRotulo", header: "Papel solicitado" },
    { key: "data", header: "Solicitado em" },
    { key: "situacao", header: "Status", render: (s) => <Badge status={s.situacao} /> },
    { key: "acoes", header: "Ações", render: (s) => s.situacao === "pendente" && (
      <div className="row">
        <Button size="sm" onClick={() => onAprovar?.(s)}>Aprovar</Button>
        <Button variant="danger" size="sm" onClick={() => setAlvo(s)}>Recusar</Button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Solicitações de todas as instituições" subtitle="Aprove ou recuse pedidos de acesso de qualquer instituição." />
      <Select label="Instituição" name="instituicaoFiltro" value={instituicaoId} options={instituicoes}
        placeholder="Todas as instituições" onChange={(e) => setInstituicaoId(e.target.value)} />
      <DataTable columns={colunas} rows={linhas} emptyTitle="Nenhuma solicitação pendente"
        emptyDescription="Novos pedidos de acesso de qualquer instituição aparecerão aqui." />
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
