export default function EmptyState({ title = "Nada por aqui ainda", description, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
