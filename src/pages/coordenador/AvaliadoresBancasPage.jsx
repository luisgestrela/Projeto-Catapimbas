import { useState } from "react";
import { PageHeader, Card, Badge, Button, EmptyState, Modal } from "../../components";

// Designação de avaliadores por banca, com o andamento das notas de cada um.
export default function AvaliadoresBancasPage({ bancas = [], disponiveis = [], onSalvar, onCriarBanca }) {
  const [alvo, setAlvo] = useState(null);
  const [marcados, setMarcados] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function abrir(b) {
    setAlvo(b);
    setMarcados(b.avaliadores.map((a) => a.id));
    setErro("");
  }
  const bloqueados = new Set((alvo?.avaliadores || []).filter((a) => a.avaliados > 0).map((a) => a.id));
  const alternar = (id) => !bloqueados.has(id) && setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  async function salvar() {
    setSalvando(true);
    const r = await onSalvar?.(alvo.id, marcados);
    setSalvando(false);
    if (r?.erro) return setErro(r.erro);
    setAlvo(null);
  }

  return (
    <>
      <PageHeader title="Avaliadores das bancas" subtitle="Designe quem avalia cada banca e acompanhe quantas notas cada avaliador já lançou." />
      {bancas.length === 0 && (
        <EmptyState title="Nenhuma banca criada" description="Crie uma banca para poder designar avaliadores."
          action={<Button onClick={onCriarBanca}>Criar banca</Button>} />
      )}
      {bancas.map((b) => (
        <Card key={b.id} title={b.nome} actions={
          b.podeDesignar
            ? <Button size="sm" onClick={() => abrir(b)}>Designar avaliadores</Button>
            : <Badge status="publicado">Resultado publicado</Badge>}>
          <p className="muted">{b.periodo} · {b.totalProjetos} {b.totalProjetos === 1 ? "projeto" : "projetos"} · <Badge status={b.status} /></p>
          {b.avaliadores.length === 0 ? (
            <p className="muted">Nenhum avaliador designado. Sem avaliadores, ninguém pode lançar notas nesta banca.</p>
          ) : (
            <ul className="lista-simples">
              {b.avaliadores.map((a) => (
                <li key={a.id} className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{a.nome}</strong>
                  <span className="muted">{a.avaliados} de {b.totalProjetos} projetos avaliados</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}

      <Modal open={!!alvo} title={`Avaliadores de ${alvo?.nome || ""}`} onClose={() => setAlvo(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setAlvo(null)}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar designação"}</Button>
        </>}>
        {erro && <div className="alert" role="alert">{erro}</div>}
        {disponiveis.length === 0 ? (
          <p className="muted">Nenhum avaliador aprovado nesta instituição. Peça ao administrador para aprovar avaliadores.</p>
        ) : (
          <fieldset>
            <legend className="muted">Marque quem vai avaliar. Quem já lançou notas não pode ser removido.</legend>
            {disponiveis.map((u) => (
              <label key={u.id} className="check">
                <input type="checkbox" checked={marcados.includes(u.id)} disabled={bloqueados.has(u.id)} onChange={() => alternar(u.id)} />
                {u.nome}{bloqueados.has(u.id) && <span className="muted"> (já avaliou)</span>}
              </label>
            ))}
          </fieldset>
        )}
      </Modal>
    </>
  );
}
