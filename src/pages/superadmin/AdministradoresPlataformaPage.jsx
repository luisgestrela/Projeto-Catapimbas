import { useState } from "react";
import { PageHeader, Card, DataTable, Badge, Button, Input, Select } from "../../components";

// Define quem administra cada instituição (visão do superadmin).
export default function AdministradoresPlataformaPage({ administradores = [], instituicoes = [], erros = {}, onAdicionar, onRevogar }) {
  const [f, setF] = useState({ instituicaoId: "", email: "" });
  const comAdmin = new Set(administradores.map((a) => a.instituicaoId));
  const semAdmin = instituicoes.filter((i) => !comAdmin.has(i.id));

  async function enviar(e) {
    e.preventDefault();
    if (!f.instituicaoId || !f.email.trim()) return;
    const ok = await onAdicionar?.(Number(f.instituicaoId), f.email.trim());
    if (ok) setF({ ...f, email: "" });
  }

  const colunas = [
    { key: "instituicao", header: "Instituição" },
    { key: "nome", header: "Administrador" },
    { key: "email", header: "E-mail" },
    { key: "situacao", header: "Situação", render: (a) => <Badge status={a.situacao} /> },
    { key: "acoes", header: "Ações", render: (a) => (
      <Button variant="danger" size="sm" onClick={() => onRevogar?.(a)}>Remover administrador</Button>
    ) },
  ];

  return (
    <>
      <PageHeader title="Administradores por instituição" subtitle="Defina qual administrador cuida de cada instituição." />
      <Card title="Definir administrador">
        <form className="form" onSubmit={enviar}>
          <Select label="Instituição" name="instituicaoId" value={f.instituicaoId} placeholder="Selecione"
            options={instituicoes.map((i) => ({ value: String(i.id), label: i.nome }))}
            onChange={(e) => setF({ ...f, instituicaoId: e.target.value })} required />
          <Input label="E-mail do usuário" name="email" type="email" value={f.email} error={erros.email}
            hint="O usuário precisa ter uma conta. Se já tiver vínculo nesta instituição, o papel passa a ser administrador."
            onChange={(e) => setF({ ...f, email: e.target.value })} required />
          <div className="row"><Button type="submit">Definir como administrador</Button></div>
        </form>
      </Card>
      {semAdmin.length > 0 && <p role="status">Sem administrador: {semAdmin.map((i) => i.nome).join(", ")}.</p>}
      <DataTable columns={colunas} rows={administradores} emptyTitle="Nenhum administrador definido"
        emptyDescription="Use o formulário acima para definir o primeiro administrador de uma instituição." />
    </>
  );
}
