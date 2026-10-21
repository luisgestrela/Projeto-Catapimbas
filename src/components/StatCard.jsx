<<<<<<< HEAD
import Icon from "./Icon";
import { CountUp } from "./Motion";

// tone: "primary" | "gold" | "ok" | "warn" — a cor é só reforço; o rótulo sempre diz o que o número significa.
export default function StatCard({ label, value, hint, icon, tone = "primary" }) {
  return (
    <div className={`stat stat-${tone}`}>
      {icon && <span className="stat-icon" aria-hidden="true"><Icon name={icon} /></span>}
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <strong><CountUp value={value ?? 0} /></strong>
        {hint && <div className="field-hint">{hint}</div>}
      </div>
=======
export default function StatCard({ label, value, hint }) {
  return (
    <div className="stat">
      <strong>{value ?? 0}</strong>
      <span>{label}</span>
      {hint && <div className="field-hint">{hint}</div>}
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
    </div>
  );
}
