import { useState } from "react";
import { PageHeader, Card, Badge, Button, Modal, CriterioForm, EmptyState } from "../../components";

export default function CriteriosPage({ instrumentos = [], onSalvarCriterio, onNovoInstrumento }) {
  const [editando, setEditando] = useState(null); // { instrumentoId, criterio? }

  return (
    <>
      <PageHeader title="Critérios e instrumentos"
        subtitle="Alterações criam nova versão; avaliações já realizadas continuam com os critérios originais."
        actions={<Button onClick={onNovoInstrumento}>Novo instrumento</Button>} />
      {instrumentos.length === 0 && (
        <EmptyState title="Nenhum instrumento criado" description="Crie um instrumento para cadastrar critérios, pesos e descritores." />
      )}
      {instrumentos.map((inst) => (
        <Card key={inst.id} title={inst.nome}
          actions={<Button size="sm" onClick={() => setEditando({ instrumentoId: inst.id })}>Adicionar critério</Button>}>
          {(inst.criterios || []).length === 0 && <p className="muted">Sem critérios ainda.</p>}
          <div className="stack">
            {(inst.criterios || []).map((c) => (
              <div key={c.id} className="row" style={{ justifyContent: "space-between" }}>
                <div>
                  <strong>{c.titulo}</strong> <Badge tone="info">Peso {c.peso}</Badge>
                  <div className="muted">Escala {c.escala?.min} a {c.escala?.max}</div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setEditando({ instrumentoId: inst.id, criterio: c })}>Editar</Button>
              </div>
            ))}
          </div>
        </Card>
      ))}
      <Modal open={!!editando} title={editando?.criterio ? "Editar critério" : "Novo critério"} onClose={() => setEditando(null)}>
        {editando && (
          <CriterioForm inicial={editando.criterio} onCancel={() => setEditando(null)}
            onSubmit={(dados) => { onSalvarCriterio?.(editando.instrumentoId, { ...editando.criterio, ...dados }); setEditando(null); }} />
        )}
      </Modal>
    </>
  );
}
