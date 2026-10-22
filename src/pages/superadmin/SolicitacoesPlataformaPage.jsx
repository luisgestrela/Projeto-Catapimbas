import { useState } from "react";
import { PageHeader, DataTable, Badge, Button, Modal, Select, Textarea, StatCard } from "../../components";

const FILTROS = [
  { valor: "pendente", rotulo: "Pendentes" },
  { valor: "recusado", rotulo: "Recusadas" },
  { valor: "todas", rotulo: "Todas" },
];

// Solicitações de ingresso de todas as instituições (visão do superadmin).
export default function SolicitacoesPlataformaPage({ solicitacoes = [], aviso, onAprovar, onRecusar }) {
  const [alvo, setAlvo] = useState(null);
  const [justificativa, setJustificativa] = useState("");
  const [instituicaoId, setInstituicaoId] = useState("");
  const [filtro, setFiltro] = useState("pendente");

  const pendentes = solicitacoes.filter((s) => s.situacao === "pendente").length;
  const recusadas = solicitacoes.filter((s) => s.situacao === "recusado").length;
  const instituicoes = [...new Map(solicitacoes.map((s) => [s.instituicaoId, s.instituicao]))]
    .map(([value, label]) => ({ value: String(value), label }));
  const linhas = solicitacoes
    .filter((s) => (!instituicaoId || String(s.instituicaoId) === instituicaoId) && (filtro === "todas" || s.situacao === filtro));

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
    { key: "situacao", header: "Status", render: (s) => (
      <div>
        <Badge status={s.situacao} />
        {s.situacao === "recusado" && s.justificativa && <div className="field-hint">Motivo: {s.justificativa}</div>}
      </div>
    ) },
    { key: "acoes", header: "Ações", render: (s) => (
      <div className="row">
        <Button size="sm" onClick={() => onAprovar?.(s)}>{s.situacao === "pendente" ? "Aprovar" : "Aprovar mesmo assim"}</Button>
        {s.situacao === "pendente" && <Button variant="danger" size="sm" onClick={() => setAlvo(s)}>Recusar</Button>}
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Solicitações de todas as instituições" subtitle="Aprove ou recuse pedidos de acesso de qualquer instituição. Quem é aprovado entra com o papel que pediu." />
      {aviso && <div className={`alert ${aviso.tipo === "erro" ? "" : "alert-ok"}`} role="status">{aviso.texto}</div>}
      <div className="grid-4">
        <StatCard icon="aprovacoes" label="Pendentes" value={pendentes} hint="Aguardando decisão" tone="warn" />
        <StatCard icon="auditoria" label="Recusadas" value={recusadas} hint="Podem ser reavaliadas" />
      </div>
      <div className="toolbar">
        <div className="field">
          <span id="filtro-situacao" className="field-label">Situação</span>
          <div className="row" role="group" aria-labelledby="filtro-situacao">
            {FILTROS.map((f) => (
              <Button key={f.valor} size="sm" variant={filtro === f.valor ? "primary" : "secondary"} aria-pressed={filtro === f.valor}
                onClick={() => setFiltro(f.valor)}>{f.rotulo}</Button>
            ))}
          </div>
        </div>
        <Select label="Instituição" name="instituicaoFiltro" value={instituicaoId} options={instituicoes}
          placeholder="Todas as instituições" onChange={(e) => setInstituicaoId(e.target.value)} />
      </div>
      <DataTable columns={colunas} rows={linhas}
        emptyTitle={filtro === "pendente" ? "Nenhuma solicitação pendente" : "Nenhuma solicitação encontrada"}
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
