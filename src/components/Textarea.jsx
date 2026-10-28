export default function Textarea({ label, error, hint, id, rows = 4, ...props }) {
  const areaId = id || props.name;
  return (
    <div className="field">
      {label && <label htmlFor={areaId}>{label}</label>}
      <textarea id={areaId} rows={rows} aria-invalid={!!error} aria-describedby={hint ? `${areaId}-dica` : undefined} {...props} />
      {hint && !error && <span id={`${areaId}-dica`} className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
