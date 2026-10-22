import { rotulosEscala } from "../utils/escala";

export default function RatingInput({ label, descricao, value, onChange, descritores = {}, min = 1, max = 5 }) {
  const notas = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const sugestoes = rotulosEscala(min, max);
  const textoDe = (n) => descritores[n] || sugestoes[n] || "Sem descrição cadastrada para esta nota.";
  return (
    <fieldset className="rating">
      <legend>{label}</legend>
      {descricao && <p className="muted" style={{ margin: 0 }}>{descricao}</p>}
      <div className="rating-options" role="radiogroup" aria-label={label}>
        {notas.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => onChange?.(n)}>
            <strong>{n}</strong>
            <span>{sugestoes[n]}</span>
          </button>
        ))}
      </div>
      {value ? (
        <p className="rating-escolhida"><strong>Nota {value}:</strong> {textoDe(value)}</p>
      ) : (
        <p className="field-hint">Escolha uma nota para ler o que ela significa.</p>
      )}
      <details>
        <summary>Ver o que significa cada nota</summary>
        <ul>{notas.map((n) => <li key={n}><strong>Nota {n}:</strong> {textoDe(n)}</li>)}</ul>
      </details>
    </fieldset>
  );
}
