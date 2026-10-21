import Logo from "./Logo";
import Icon from "./Icon";
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Logo light href="/" />
        <div>
          <h2>Cada nota, com o rastro de quem lançou.</h2>
          <p>Bancas, rubricas e rankings da sua instituição, separados dos de qualquer outra.</p>
        </div>
        <span className="auth-art" aria-hidden="true"><Icon name="ranking" /></span>
      </aside>
      <main className="auth-main">
        <div className="auth-box">
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
          {footer && <p className="muted" style={{ marginTop: "1.2rem", marginBottom: 0 }}>{footer}</p>}
        </div>
      </main>
    </div>
  );
}
