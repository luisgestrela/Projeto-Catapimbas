<<<<<<< HEAD
import { Button, Icon, SplitText } from "../../components";
import LandingDock from "../../components/LandingDock";

// Dados de exemplo apenas para ilustrar o ranking na página inicial.
const RANKING = [
  { nome: "AcolheMãe", nota: 4.62, faixa: "Ouro" },
  { nome: "InovArt", nota: 4.28, faixa: "Prata" },
  { nome: "VANMO", nota: 3.94, faixa: "Bronze" },
  { nome: "HECO", nota: 3.51, faixa: "Destaque" },
];

const DIFERENCIAIS = [
  { t: "Várias instituições, dados separados", d: "Cada instituição enxerga só os próprios projetos, bancas e resultados.", i: "instituicoes" },
  { t: "Rubricas por critério", d: "Notas com descritores que orientam cada avaliador e padronizam a decisão.", i: "criterios" },
  { t: "Histórico auditável", d: "Aprovações, notas e permissões ficam registradas e podem ser conferidas.", i: "auditoria" },
  { t: "Ranking, pódio e Excel", d: "Pontuação ponderada, desempate definido antes da publicação e exportação em planilha.", i: "ranking" },
];

const PASSOS = [
  { t: "Cadastre as equipes", d: "Crie a instituição, aprove os acessos e defina projetos, critérios e avaliadores." },
  { t: "Avalie com rubricas", d: "Cada avaliador lança notas por critério e recebe um recibo com protocolo." },
  { t: "Publique o resultado", d: "O sistema calcula o ranking, mostra o pódio e exporta a planilha pronta." },
=======
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
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
];

export default function LandingPage() {
  return (
<<<<<<< HEAD
    <div className="kv">
      <LandingDock />

      <section className="kv-hero" id="topo">
        <span className="kv-eyebrow kv-in" style={{ "--d": "0ms" }}>Avaliação de startups</span>
        <SplitText as="h1" delay={150}>Do projeto ao pódio, com cada nota registrada.</SplitText>
        <p className="kv-lead kv-in" style={{ "--d": "700ms" }}>Organize bancas, avalie equipes com rubricas e publique rankings claros e confiáveis para a sua instituição ou incubadora.</p>
        <div className="kv-cta-row kv-in" style={{ "--d": "850ms" }}>
          <Button href="/cadastro">Solicitar acesso</Button>
          <Button href="/login" variant="secondary">Já tenho conta</Button>
        </div>

        <div className="kv-mock kv-in" style={{ "--d": "1000ms" }} aria-label="Exemplo de resultado">
          <div className="kv-mock-head">
            <div><strong>Banca final</strong><span>Demonstração de resultado</span></div>
            <span className="kv-pill">Exemplo</span>
          </div>
          <div className="kv-mock-body">
            <div className="kv-best">
              <span className="kv-tag">Equipe campeã</span>
              <div className="kv-best-name"><span className="kv-best-icon"><Icon name="trofeu" /></span><h3>{RANKING[0].nome}</h3></div>
              <div className="kv-best-stats">
                <div><strong>{RANKING[0].nota.toFixed(2)}</strong><span>Pontuação</span></div>
                <div><strong>+{(RANKING[0].nota - RANKING[1].nota).toFixed(2)}</strong><span>Sobre o 2º</span></div>
              </div>
            </div>
            <div className="kv-others">
              <h4>Demais equipes</h4>
              {RANKING.slice(1).map((r, i) => (
                <div className="kv-other" key={r.nome} style={{ "--i": i }}>
                  <span className="kv-pos">{i + 2}º</span>
                  <strong>{r.nome}</strong>
                  <span className="kv-score">{r.nota.toFixed(2)}</span>
                  <span className="kv-pill soft">{r.faixa}</span>
                </div>
              ))}
            </div>
=======
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
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
          </div>
        </div>
      </section>

<<<<<<< HEAD
      <section className="kv-section" id="recursos">
        <span className="kv-eyebrow">Recursos</span>
        <h2 data-reveal>Tudo o que uma banca de avaliação precisa.</h2>
        <div className="kv-grid">
          {DIFERENCIAIS.map((d, i) => (
            <article className="kv-card" data-reveal key={d.t} style={{ "--d": `${i * 90}ms` }}>
              <span className="kv-card-icon"><Icon name={d.i} /></span>
              <h3>{d.t}</h3>
              <p>{d.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="kv-section" id="como-funciona">
        <span className="kv-eyebrow">Como funciona</span>
        <h2 data-reveal>Como a plataforma se encaixa no seu fluxo.</h2>
        <ol className="kv-steps">
          {PASSOS.map((p, i) => (
            <li key={p.t} data-reveal style={{ "--d": `${i * 120}ms` }}><span className="kv-step-n">Passo {i + 1}</span><h3>{p.t}</h3><p>{p.d}</p></li>
=======
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
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
          ))}
        </ol>
      </section>

<<<<<<< HEAD
      <section className="kv-final" data-reveal>
        <span className="kv-eyebrow light">Comece agora</span>
        <h2>Pronto para levar a sua próxima banca para a plataforma?</h2>
        <p>Solicite acesso e organize avaliações, ranking e pódio em um só lugar.</p>
        <div className="kv-cta-row">
          <Button href="/cadastro" className="btn-light">Solicitar acesso</Button>
          <Button href="/login" variant="ghost" className="kv-ghost-light">Entrar</Button>
        </div>
      </section>

      <footer className="kv-footer">
        <span>Plataforma de gestão e avaliação de startups e projetos acadêmicos</span>
        <span><a href="/login">Entrar</a> · <a href="/cadastro">Solicitar acesso</a></span>
      </footer>
=======
      <section className="lp-cta">
        <h2>Leve a sua próxima banca para a plataforma</h2>
        <Button href="/cadastro" className="btn-light">Solicitar acesso</Button>
      </section>
      <footer className="lp-footer">Plataforma de gestão e avaliação de startups e projetos acadêmicos</footer>
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
    </div>
  );
}
