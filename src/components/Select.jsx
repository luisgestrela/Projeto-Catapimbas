export default function Select({ label, error, hint, id, options = [], placeholder, ...props }) {
  const selectId = id || props.name;
  return (
    <div className="field">
      {label && <label htmlFor={selectId}>{label}</label>}
      <select id={selectId} aria-invalid={!!error} aria-describedby={hint ? `${selectId}-dica` : undefined} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
      {hint && !error && <span id={`${selectId}-dica`} className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
