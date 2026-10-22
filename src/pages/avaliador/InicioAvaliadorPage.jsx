import { PageHeader, Card, Badge, Button, EmptyState, StatCard } from "../../components";

const PASSOS = [
  { t: "Escolha a banca", d: "Em “Minhas bancas” aparecem os grupos de avaliação para os quais você foi designado." },
  { t: "Escolha o projeto", d: "Selecione a startup que você vai avaliar. Os já avaliados aparecem marcados." },
  { t: "Dê uma nota a cada critério", d: "Leia o que cada nota significa antes de escolher. Todos os critérios precisam de nota." },
  { t: "Revise e envie", d: "Confira as notas e envie. Você recebe um recibo com protocolo para guardar." },
];

const data = (iso) => new Date(`${iso}T12:00`).toLocaleDateString("pt-BR");

export default function InicioAvaliadorPage({ nome = "", instituicao, bancas = [], onAbrirBanca, onVerBancas }) {
  const abertas = bancas.filter((b) => b.status === "aberta");
  const pendentes = (b) => Math.max(0, (b.totalProjetos ?? 0) - (b.avaliados ?? 0));
  const proxima = abertas.find((b) => pendentes(b) > 0);
  const faltam = abertas.reduce((s, b) => s + pendentes(b), 0);
  const feitos = bancas.reduce((s, b) => s + (b.avaliados ?? 0), 0);
  const primeiroNome = nome.split(" ")[0];

  return (
    <>
      <PageHeader title={`Olá, ${primeiroNome || "avaliador"}!`}
        subtitle={instituicao ? `Você é avaliador(a) em ${instituicao}.` : "Você é avaliador(a) nesta instituição."}
        actions={proxima
          ? <Button onClick={() => onAbrirBanca?.(proxima)}>Continuar avaliando</Button>
          : <Button variant="secondary" onClick={onVerBancas}>Ver minhas bancas</Button>} />

      <Card title="O que você faz aqui">
        <p>
          Como avaliador, você dá notas aos projetos das bancas para as quais foi designado. As notas de todos os avaliadores são somadas
          com pesos por critério e formam o ranking final da banca. Você não precisa cadastrar nada: só avaliar.
        </p>
        <ul className="regras">
          <li>Cada projeto é avaliado <strong>uma única vez</strong> por você em cada banca.</li>
          <li>Depois de enviada, uma nota só muda com autorização do coordenador, e a mudança fica registrada.</li>
          <li>Você só consegue avaliar enquanto a banca estiver aberta, dentro do período dela.</li>
        </ul>
      </Card>

      <Card title="Como avaliar, passo a passo">
        <ol className="passos">
          {PASSOS.map((p, i) => (
            <li key={p.t}><span className="passo-n" aria-hidden="true">{i + 1}</span><div><strong>{p.t}</strong><p className="muted">{p.d}</p></div></li>
          ))}
        </ol>
      </Card>

      <div>
        <h2>Suas bancas</h2>
        {bancas.length === 0 ? (
          <EmptyState title="Você ainda não foi designado a nenhuma banca"
            description="Quando um coordenador ou administrador designar você, a banca aparece aqui e em “Minhas bancas”. Por enquanto não há nada para fazer." />
        ) : (
          <div className="stack">
            <div className="grid-4">
              <StatCard icon="bancas" label="Bancas abertas" value={abertas.length} hint="Em que você pode avaliar agora" />
              <StatCard icon="auditoria" tone="warn" label="Projetos para avaliar" value={faltam} hint="Ainda sem a sua nota" />
              <StatCard icon="aprovacoes" tone="ok" label="Projetos já avaliados" value={feitos} hint="Notas que você já enviou" />
            </div>
            {bancas.map((b) => (
              <Card key={b.id} title={b.nome} actions={<Badge status={b.status} />}>
                <p className="muted">{b.periodo}{b.status === "aberta" ? ` · você pode avaliar até ${data(b.fim)}` : ""}</p>
                <p>{b.avaliados ?? 0} de {b.totalProjetos ?? 0} projetos avaliados por você</p>
                <Button disabled={b.status !== "aberta"} onClick={() => onAbrirBanca?.(b)}>
                  {b.status !== "aberta" ? "Banca encerrada" : pendentes(b) === 0 ? "Revisar projetos" : "Avaliar projetos"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
