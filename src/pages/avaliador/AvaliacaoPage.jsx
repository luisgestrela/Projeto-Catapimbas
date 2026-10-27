import { useEffect, useRef, useState } from "react";
import { PageHeader, Card, RatingInput, Button, Modal, Badge, Progresso } from "../../components";

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "pendentes", rotulo: "Pendentes" },
  { id: "avaliados", rotulo: "Avaliados" },
];

// projetos: [{ id, nome, jaAvaliado, avaliacaoId }]. `onSubmit` deve devolver uma promessa; enquanto ela não termina,
// o botão de envio fica travado, o que evita enviar a mesma avaliação duas vezes (duplo clique, toque repetido).
export default function AvaliacaoPage({ banca = {}, projetos = [], criterios = [], projetoInicialId = "", erro, onSubmit, onVerRecibo }) {
  const [projetoId, setProjetoId] = useState(projetoInicialId ? String(projetoInicialId) : "");
  const [notas, setNotas] = useState({});
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState("todos");
  const travaEnvio = useRef(false);
  const areaForm = useRef(null);

  const projeto = projetos.find((p) => String(p.id) === String(projetoId));
  const completo = projeto && criterios.length > 0 && criterios.every((c) => notas[c.id]);
  const avaliados = projetos.filter((p) => p.jaAvaliado).length;
  const pendentes = projetos.length - avaliados;
  const visiveis = projetos.filter((p) => filtro === "todos" || (filtro === "avaliados" ? p.jaAvaliado : !p.jaAvaliado));

  // Se o servidor disser que o projeto já foi avaliado (ex.: em outro aparelho), as notas digitadas deixam de valer.
  useEffect(() => { if (projeto?.jaAvaliado) setNotas({}); }, [projeto?.jaAvaliado]);

  function aoEscolher(p) {
    if (String(p.id) !== String(projetoId)) {
      setProjetoId(String(p.id));
      setNotas({});
    }
    // Em telas pequenas a lista é longa: leva o avaliador direto ao formulário (sem animação se ele preferir assim).
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => areaForm.current?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" }));
  }

  async function enviar() {
    if (travaEnvio.current) return;
    travaEnvio.current = true;
    setEnviando(true);
    try {
      await onSubmit?.({ projetoId, notas });
    } finally {
      travaEnvio.current = false;
      setEnviando(false);
      setConfirmando(false);
    }
  }

  return (
    <>
      <PageHeader title={banca.nome || "Avaliação"} subtitle="Cada projeto só pode ser avaliado uma vez por avaliador nesta banca." />
      {erro && <div className="alert" role="alert">{erro}</div>}

      <Card title="Seus projetos nesta banca">
        <div className="avaliacao-resumo">
          <div className="row">
            <Badge tone="success">{avaliados} {avaliados === 1 ? "avaliado" : "avaliados"}</Badge>
            <Badge tone={pendentes > 0 ? "warning" : "neutral"}>{pendentes} {pendentes === 1 ? "pendente" : "pendentes"}</Badge>
          </div>
          <Progresso feitos={avaliados} total={projetos.length} rotulo="Projetos avaliados por você" />
        </div>
        {projetos.length > 0 && pendentes === 0 && (
          <div className="alert alert-ok" role="status">Você já avaliou todos os projetos desta banca. Obrigado!</div>
        )}

        <div className="chips" role="group" aria-label="Filtrar projetos">
          {FILTROS.map((f) => (
            <button key={f.id} type="button" className="chip" aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>
              {f.rotulo}
              <span className="chip-n">{f.id === "todos" ? projetos.length : f.id === "avaliados" ? avaliados : pendentes}</span>
            </button>
          ))}
        </div>

        {visiveis.length === 0 ? (
          <p className="muted">{projetos.length === 0 ? "Esta banca ainda não tem projetos." : "Nenhum projeto neste filtro."}</p>
        ) : (
          <ul className="projeto-status-lista">
            {visiveis.map((p) => {
              const ativo = String(p.id) === String(projetoId);
              return (
                <li key={p.id} className={`projeto-status${p.jaAvaliado ? " feito" : ""}${ativo ? " ativo" : ""}`}>
                  <div className="projeto-status-info">
                    <strong>{p.nome}</strong>
                    {p.jaAvaliado ? <Badge tone="success">Avaliado</Badge> : <Badge tone="warning">Pendente</Badge>}
                  </div>
                  {p.jaAvaliado ? (
                    p.avaliacaoId && <Button variant="secondary" size="sm" onClick={() => onVerRecibo?.(p)} aria-label={`Ver recibo de ${p.nome}`}>Ver recibo</Button>
                  ) : (
                    <Button size="sm" variant={ativo ? "secondary" : "primary"} onClick={() => aoEscolher(p)} aria-label={`Avaliar ${p.nome}`} aria-pressed={ativo}>
                      {ativo ? "Selecionado" : "Avaliar"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div ref={areaForm} className="avaliacao-form-area" tabIndex={-1}>
        {!projeto && projetos.length > 0 && pendentes > 0 && <p className="muted">Escolha um projeto pendente na lista acima para começar a avaliar.</p>}
        {projeto?.jaAvaliado && (
          <div className="alert alert-ok" role="status">
            Você já enviou a avaliação de <strong>{projeto.nome}</strong>. Para corrigir, solicite uma edição ao coordenador.
            {projeto.avaliacaoId && <Button variant="ghost" size="sm" onClick={() => onVerRecibo?.(projeto)}>Ver recibo</Button>}
          </div>
        )}
        {projeto && !projeto.jaAvaliado && (
          <div className="stack">
            <h2>Avaliando: {projeto.nome}</h2>
            {criterios.map((c) => (
              <RatingInput key={c.id} label={c.titulo} descricao={c.descricao} descritores={c.descritores}
                min={c.escala?.min} max={c.escala?.max} value={notas[c.id]} onChange={(n) => setNotas({ ...notas, [c.id]: n })} />
            ))}
            <div className="row acoes-fixas">
              <Button disabled={!completo || enviando} onClick={() => setConfirmando(true)}>Revisar e enviar</Button>
              {!completo && <span className="field-hint">Atribua nota a todos os critérios.</span>}
            </div>
          </div>
        )}
      </div>

      <Modal open={confirmando} title="Confirmar envio" onClose={() => !enviando && setConfirmando(false)}
        footer={<>
          <Button variant="secondary" disabled={enviando} onClick={() => setConfirmando(false)}>Voltar</Button>
          <Button disabled={enviando} onClick={enviar}>{enviando ? "Enviando…" : "Enviar avaliação"}</Button>
        </>}>
        <p>Projeto: <strong>{projeto?.nome}</strong></p>
        <ul>{criterios.map((c) => <li key={c.id}>{c.titulo}: <strong>{notas[c.id]}</strong></li>)}</ul>
        <p className="muted">Depois do envio, alterações exigem edição autorizada e ficam registradas na auditoria.</p>
      </Modal>
    </>
  );
}
