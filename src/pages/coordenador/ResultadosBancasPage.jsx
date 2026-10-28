import { PageHeader, DataTable, Badge, Button, EmptyState } from "../../components";

// Resultados de todas as bancas da instituição, para a coordenação consultar, exportar e publicar.
export default function ResultadosBancasPage({ bancas = [], onAbrir, onPodio, onExportar, onPublicar, onCriarBanca }) {
  const colunas = [
    { key: "nome", header: "Banca", render: (b) => <button className="btn btn-ghost btn-sm" onClick={() => onAbrir?.(b)}>{b.nome}</button> },
    { key: "periodo", header: "Período" },
    { key: "status", header: "Situação", render: (b) => <Badge status={b.status} /> },
    { key: "progresso", header: "Notas lançadas", render: (b) => `${b.avaliados} de ${b.previstas}` },
    { key: "lider", header: "Líder atual", render: (b) => (b.lider ? `${b.lider}${b.empate ? " (empate)" : ""} — ${b.pontuacao.toFixed(2)}` : "—") },
    { key: "resultado", header: "Resultado", render: (b) => <Badge status={b.resultado} /> },
    { key: "acoes", header: "Ações", render: (b) => (
      <div className="row">
        <Button size="sm" variant="secondary" onClick={() => onAbrir?.(b)}>Ver resultados</Button>
        {b.resultado === "publicado" && <Button size="sm" variant="secondary" onClick={() => onPodio?.(b)}>Pódio</Button>}
        <Button size="sm" variant="secondary" onClick={() => onExportar?.(b)}>Exportar</Button>
        {b.resultado !== "publicado" && b.avaliados > 0 && <Button size="sm" onClick={() => onPublicar?.(b)}>Publicar</Button>}
      </div>
    ) },
  ];
  return (
    <>
      <PageHeader title="Resultados das bancas" subtitle="Consulte o ranking de cada banca, exporte a planilha e publique o resultado quando estiver conferido." />
      {bancas.length === 0
        ? <EmptyState title="Nenhuma banca criada" description="Os resultados aparecem aqui depois que uma banca recebe avaliações." action={<Button onClick={onCriarBanca}>Criar banca</Button>} />
        : <DataTable columns={colunas} rows={bancas} />}
    </>
  );
}
