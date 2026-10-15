import { Button, Logo, Badge, Icon } from "../../components";

// Dados de exemplo apenas para ilustrar o ranking na página inicial.
const RANKING = [
  { nome: "AcolheMãe", nota: 4.62 },
  { nome: "InovArt", nota: 4.28 },
  { nome: "VANMO", nota: 3.94 },
  { nome: "HECO", nota: 3.51 },
  { nome: "SalvadorGO!", nota: 3.12 },
];

const PASSOS = [
  { t: "Instituição", d: "O superadministrador cria e ativa a instituição." },
  { t: "Aprovação", d: "O administrador aprova quem pediu acesso." },
  { t: "Projetos e banca", d: "Equipes, critérios e avaliadores são definidos." },
  { t: "Avaliação", d: "Cada avaliador lança notas com as rubricas." },
  { t: "Resultado", d: "Ranking, pódio e planilha Excel." },
];

export default function LandingPage() {
  return (
    <div>
      <header className="lp-nav">
        <Logo light href="/" />
        <nav className="row">
          <a className="nav-link" href="#recursos">Recursos</a>
          <a className="nav-link" href="#como-funciona">Como funciona</a>
          <Button href="/login" variant="secondary" size="sm">Entrar</Button>
          <Button href="/cadastro" size="sm">Solicitar acesso</Button>
        </nav>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-grid">
          <div>
            <h1>Do projeto ao <span>pódio</span>, com cada nota registrada.</h1>
            <p className="lead">Organize bancas, avalie startups com rubricas e publique rankings confiáveis para a sua instituição ou incubadora.</p>
            <div className="row" style={{ marginTop: "1.6rem" }}>
              <Button href="/cadastro">Solicitar acesso</Button>
              <Button href="/login" variant="secondary" className="btn-light">Já tenho conta</Button>
            </div>
          </div>
          <div className="lp-rank" aria-label="Exemplo de ranking">
            <header>
              <h2><Icon name="ranking" />Banca final de avaliação das startups</h2>
              <Badge tone="info">Exemplo</Badge>
            </header>
            {RANKING.map((r, i) => (
              <div className="lp-row" key={r.nome}>
                <span className={`lp-pos ${i < 3 ? `p${i + 1}` : ""}`}>{i + 1}</span>
                <div>
                  <strong>{r.nome}</strong>
                  <div className="lp-bar"><i style={{ width: `${(r.nota / 5) * 100}%` }} /></div>
                </div>
                <span className="lp-score">{r.nota.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="recursos">
        <h2>Tudo o que uma banca de avaliação precisa</h2>
        <div className="lp-bento">
          <article className="lp-tile wide tint">
            <h3>Várias instituições, dados separados</h3>
            <p>Cada instituição enxerga só os próprios projetos, bancas e resultados. Uma mesma pessoa pode ter papéis diferentes em instituições diferentes.</p>
          </article>
          <article className="lp-tile">
            <h3>Rubricas por nota</h3>
            <p>Notas de 1 a 5 com descritores que orientam cada avaliador.</p>
          </article>
          <article className="lp-tile">
            <h3>Histórico completo</h3>
            <p>Aprovações, notas e permissões ficam registradas na auditoria.</p>
          </article>
          <article className="lp-tile wide dark">
            <h3>Ranking, pódio e Excel</h3>
            <p>Pontuação ponderada por critério, regra de desempate definida antes da publicação e exportação da planilha com os filtros aplicados.</p>
          </article>
        </div>
      </section>

      <section className="lp-section" id="como-funciona">
        <h2>Como funciona</h2>
        <ol className="lp-steps">
          {PASSOS.map((p) => (
            <li key={p.t}><strong>{p.t}</strong><span>{p.d}</span></li>
          ))}
        </ol>
      </section>

      <section className="lp-cta">
        <h2>Leve a sua próxima banca para a plataforma</h2>
        <Button href="/cadastro" className="btn-light">Solicitar acesso</Button>
      </section>
      <footer className="lp-footer">Plataforma de gestão e avaliação de startups e projetos acadêmicos</footer>
    </div>
  );
}
