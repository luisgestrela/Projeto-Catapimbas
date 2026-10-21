export default function Textarea({ label, error, id, rows = 4, ...props }) {
  const areaId = id || props.name;
  return (
    <div className="field">
      {label && <label htmlFor={areaId}>{label}</label>}
      <textarea id={areaId} rows={rows} aria-invalid={!!error} {...props} />
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}
