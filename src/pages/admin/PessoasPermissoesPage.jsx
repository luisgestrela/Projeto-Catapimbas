import { PageHeader, DataTable, Badge, Button, Select } from "../../components";

const PAPEIS = [
  { value: "administrador", label: "Administrador institucional" },
  { value: "coordenador", label: "Coordenador" },
  { value: "orientador", label: "Orientador" },
  { value: "avaliador", label: "Avaliador" },
  { value: "aluno", label: "Aluno" },
];

export default function PessoasPermissoesPage({ vinculos = [], onAlterarPapel, onBloquear, onRevogar }) {
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
      <DataTable columns={colunas} rows={vinculos} emptyTitle="Nenhuma pessoa vinculada" />
    </>
  );
}
