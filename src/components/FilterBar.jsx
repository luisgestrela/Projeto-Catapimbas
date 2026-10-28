import Button from "./Button";
export default function FilterBar({ children, onSubmit, onClear }) {
  return (
    <form className="toolbar" onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}>
      {children}
      <div className="row">
        <Button type="submit">Filtrar</Button>
        {onClear && <Button variant="secondary" onClick={onClear}>Limpar</Button>}
      </div>
    </form>
  );
}
