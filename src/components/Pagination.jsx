import Button from "./Button";
export default function Pagination({ page = 1, totalPages = 1, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginação">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange?.(page - 1)}>Anterior</Button>
      <span>Página {page} de {totalPages}</span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange?.(page + 1)}>Próxima</Button>
    </nav>
  );
}
