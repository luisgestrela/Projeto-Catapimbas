import EmptyState from "./EmptyState";
export default function DataTable({ columns = [], rows = [], rowKey = "id", emptyTitle = "Nenhum registro encontrado", emptyDescription }) {
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return (
    <div className="table-wrap" role="region" aria-label="Tabela de dados" tabIndex={0}>
      <table>
        <thead><tr>{columns.map((c) => <th key={c.key} scope="col" className={c.numeric ? "num" : undefined}>{c.header}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r[rowKey] ?? i}>
              {columns.map((c) => <td key={c.key} className={c.numeric ? "num" : undefined}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
