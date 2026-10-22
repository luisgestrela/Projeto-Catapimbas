import { useState } from "react";
import { PageHeader, Card, Badge, Button, Modal, CriterioForm, EmptyState, Input, Textarea, InstrumentoAjuda } from "../../components";

const faltamDescritores = (c) => {
  const total = (c.escala?.max ?? 0) - (c.escala?.min ?? 0) + 1;
  return Object.values(c.descritores || {}).filter((t) => String(t).trim()).length < total;
};

export default function CriteriosPage({ instrumentos = [], onSalvarCriterio, onNovoInstrumento, onEditarInstrumento }) {
  const [editando, setEditando] = useState(null); // { instrumentoId, criterio? }
  const [novo, setNovo] = useState(false);
  const [renomeando, setRenomeando] = useState(null); // instrumento em edição
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function abrirNovo() { setNome(""); setDescricao(""); setErro(""); setNovo(true); }
  function abrirEdicao(inst) { setNome(inst.nome); setDescricao(inst.descricao || ""); setErro(""); setRenomeando(inst); }

  async function renomear(e) {
    e.preventDefault();
    if (nome.trim().length < 2) return setErro("O nome do instrumento precisa ter pelo menos 2 letras.");
    setSalvando(true);
    const r = await onEditarInstrumento?.(renomeando.id, nome.trim(), descricao.trim());
    setSalvando(false);
    if (r?.erro) return setErro(r.campos?.nome || r.erro);
    setRenomeando(null);
  }

  async function criar(e) {
    e.preventDefault();
    if (nome.trim().length < 2) return setErro("Dê um nome ao instrumento, com pelo menos 2 letras.");
    setSalvando(true);
    const r = await onNovoInstrumento?.(nome.trim(), descricao.trim());
    setSalvando(false);
    if (r?.erro) return setErro(r.campos?.nome || r.erro);
    setNovo(false);
  }

  return (
    <>
      <PageHeader title="Critérios e instrumentos"
        subtitle="Monte as fichas de avaliação usadas nas bancas. Alterações criam nova versão; avaliações já realizadas continuam com os critérios originais."
        actions={<Button onClick={abrirNovo}>Novo instrumento</Button>} />
      {instrumentos.length === 0 && (
        <>
          <InstrumentoAjuda />
          <EmptyState title="Nenhum instrumento criado" description="Comece criando o primeiro instrumento. Depois você adiciona os critérios, o peso e o que significa cada nota."
            action={<Button onClick={abrirNovo}>Criar o primeiro instrumento</Button>} />
        </>
      )}
      {instrumentos.map((inst) => (
        <Card key={inst.id} title={inst.nome}
          actions={<>
            <Button size="sm" variant="secondary" onClick={() => abrirEdicao(inst)} aria-label={`Editar nome do instrumento ${inst.nome}`}>Editar nome</Button>
            <Button size="sm" onClick={() => setEditando({ instrumentoId: inst.id })}>Adicionar critério</Button>
          </>}>
          {inst.descricao && <p className="muted">{inst.descricao}</p>}
          {(inst.criterios || []).length === 0 && (
            <p className="muted">Este instrumento ainda não tem critérios. Clique em “Adicionar critério” para começar; sem critérios ele não pode ser usado em uma banca.</p>
          )}
          <div className="stack">
            {(inst.criterios || []).map((c) => (
              <div key={c.id} className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <strong>{c.titulo}</strong> <Badge tone="info">Peso {c.peso}</Badge>{faltamDescritores(c) && <> <Badge tone="warning">Faltam descrições das notas</Badge></>}
                  <div className="muted">Notas de {c.escala?.min} a {c.escala?.max}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setEditando({ instrumentoId: inst.id, criterio: c })}>Editar</Button>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Modal open={novo} title="Novo instrumento de avaliação" onClose={() => setNovo(false)}
        footer={<>
          <Button variant="secondary" onClick={() => setNovo(false)}>Cancelar</Button>
          <Button type="submit" form="form-novo-instrumento" disabled={salvando}>{salvando ? "Criando..." : "Criar instrumento"}</Button>
        </>}>
        <form id="form-novo-instrumento" className="form" onSubmit={criar} noValidate>
          <p className="muted">Você poderá adicionar os critérios logo depois de criar.</p>
          {erro && <div className="alert" role="alert">{erro}</div>}
          <Input label="Nome do instrumento" name="nome-instrumento" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} autoFocus
            hint="Ex.: Banca final de startups 2026." />
          <Textarea label="Descrição (opcional)" name="descricao-instrumento" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={500}
            hint="Ajuda quem for escolher o instrumento ao criar uma banca." />
        </form>
      </Modal>

      <Modal open={!!renomeando} title="Editar instrumento" onClose={() => setRenomeando(null)}
        footer={<>
          <Button variant="secondary" onClick={() => setRenomeando(null)}>Cancelar</Button>
          <Button type="submit" form="form-editar-instrumento" disabled={salvando}>{salvando ? "Salvando..." : "Salvar alterações"}</Button>
        </>}>
        <form id="form-editar-instrumento" className="form" onSubmit={renomear} noValidate>
          <p className="muted">Mudar o nome não altera os critérios nem as bancas que já usam este instrumento.</p>
          {erro && <div className="alert" role="alert">{erro}</div>}
          <Input label="Nome do instrumento" name="nome-instrumento-edicao" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} autoFocus />
          <Textarea label="Descrição (opcional)" name="descricao-instrumento-edicao" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={500} />
        </form>
      </Modal>

      <Modal open={!!editando} title={editando?.criterio ? "Editar critério" : "Novo critério"} onClose={() => setEditando(null)}>
        {editando && (
          <CriterioForm inicial={editando.criterio} onCancel={() => setEditando(null)}
            onSubmit={(dados) => { onSalvarCriterio?.(editando.instrumentoId, { ...editando.criterio, ...dados }); setEditando(null); }} />
        )}
      </Modal>
    </>
  );
}
