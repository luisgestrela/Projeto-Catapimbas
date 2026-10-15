export default function StatCard({ label, value, hint }) {
  return (
    <div className="stat">
      <strong>{value ?? 0}</strong>
      <span>{label}</span>
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}
