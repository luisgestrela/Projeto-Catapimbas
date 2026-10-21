export default function Input({ label, error, hint, id, ...props }) {
  const inputId = id || props.name;
  return (
    <div className="field">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input id={inputId} aria-invalid={!!error} aria-describedby={error ? `${inputId}-erro` : undefined} {...props} />
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span id={`${inputId}-erro`} className="field-error" role="alert">{error}</span>}
    </div>
  );
}
