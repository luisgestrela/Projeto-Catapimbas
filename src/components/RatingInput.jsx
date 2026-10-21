export default function RatingInput({ label, descricao, value, onChange, descritores = {}, min = 1, max = 5 }) {
  const notas = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <fieldset className="rating">
      <legend>{label}</legend>
      {descricao && <p className="muted" style={{ margin: 0 }}>{descricao}</p>}
      <div className="rating-options" role="radiogroup" aria-label={label}>
        {notas.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange?.(n)}>{n}</button>
        ))}
      </div>
      {value ? (
        <p><strong>Nota {value}:</strong> {descritores[value] || "Sem descritor cadastrado para esta nota."}</p>
      ) : (
        <p className="field-hint">Escolha uma nota para ver o descritor.</p>
      )}
      <details>
        <summary>Ver todos os descritores</summary>
        <ul>{notas.map((n) => <li key={n}><strong>{n}:</strong> {descritores[n] || "—"}</li>)}</ul>
      </details>
    </fieldset>
  );
}
