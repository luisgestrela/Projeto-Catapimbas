import { PageHeader, Card, Badge, Button, EmptyState, StatCard } from "../../components";

// Painel do coordenador: o que precisa de atenção para organizar bancas, designar avaliadores e fechar resultados.
export default function PainelCoordenadorPage({ nome = "", instituicao, indicadores = {}, atencao = [], proximas = [], onNovaBanca, onAbrirBanca, onAvaliadores, onResultados }) {
  const primeiroNome = nome.split(" ")[0];
  return (
    <>
      <PageHeader title={`Olá, ${primeiroNome || "coordenador"}!`}
        subtitle={instituicao ? `Painel de coordenação de ${instituicao}.` : "Painel de coordenação."}
        actions={<Button onClick={onNovaBanca}>Nova banca</Button>} />

      <div className="grid-4">
        <StatCard icon="bancas" label="Bancas abertas" value={indicadores.abertas} hint="Recebendo avaliações" />
        <StatCard icon="avaliar" label="Notas pendentes" value={indicadores.avaliacoesPendentes} hint="Ainda aguardando avaliadores" tone="warn" />
        <StatCard icon="ranking" label="Resultados a publicar" value={indicadores.aguardandoPublicacao} hint="Bancas encerradas em rascunho" tone="gold" />
        <StatCard icon="pessoas" label="Sem avaliadores" value={indicadores.semAvaliadores} hint="Bancas sem ninguém designado" tone="warn" />
      </div>

      <Card title="O que você faz aqui">
        <ol className="passos">
          <li><span className="passo-n" aria-hidden="true">1</span><div><strong>Organize a banca</strong><p className="muted">Defina o período, o instrumento de avaliação e os projetos participantes em “Bancas”.</p></div></li>
          <li><span className="passo-n" aria-hidden="true">2</span><div><strong>Designe os avaliadores</strong><p className="muted">Em “Avaliadores” você escolhe quem avalia cada banca e acompanha o andamento das notas.</p></div></li>
          <li><span className="passo-n" aria-hidden="true">3</span><div><strong>Consulte e publique os resultados</strong><p className="muted">Em “Resultados” você vê o ranking, corrige notas com justificativa, exporta e publica.</p></div></li>
        </ol>
        <div className="row">
          <Button variant="secondary" onClick={onAvaliadores}>Designar avaliadores</Button>
          <Button variant="secondary" onClick={onResultados}>Ver resultados</Button>
        </div>
      </Card>

      <Card title="Precisa da sua atenção">
        {atencao.length === 0 ? (
          <EmptyState title="Tudo em dia" description="Nenhuma banca com pendência no momento." />
        ) : (
          <ul className="lista-simples">
            {atencao.map((a) => (
              <li key={`${a.id}-${a.motivo}`} className="row" style={{ justifyContent: "space-between" }}>
                <span><strong>{a.nome}</strong> <Badge tone={a.tone || "warning"}>{a.motivo}</Badge></span>
                <Button size="sm" variant="secondary" onClick={() => onAbrirBanca?.(a)}>Abrir</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {proximas.length > 0 && (
        <Card title="Bancas em andamento">
          <ul className="lista-simples">
            {proximas.map((b) => (
              <li key={b.id} className="row" style={{ justifyContent: "space-between" }}>
                <span><strong>{b.nome}</strong> <span className="muted">{b.periodo}</span></span>
                <span className="muted">{b.avaliados} de {b.previstas} notas lançadas</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
