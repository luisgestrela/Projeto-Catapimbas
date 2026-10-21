export default function Select({ label, error, id, options = [], placeholder, ...props }) {
  const selectId = id || props.name;
  return (
    <div className="field">
      {label && <label htmlFor={selectId}>{label}</label>}
      <select id={selectId} aria-invalid={!!error} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
