import Icon from "./Icon";
export default function Card({ title, icon, actions, children, className = "" }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || actions) && (
        <div className="card-head">{title && <h2>{icon && <Icon name={icon} />}{title}</h2>}{actions}</div>
      )}
      {children}
    </section>
  );
}
