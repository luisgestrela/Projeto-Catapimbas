import { useState } from "react";
import { PageHeader, Card, Input, Select, Button } from "../../components";

export default function BancaFormPage({ inicial = {}, projetos = [], avaliadores = [], instrumentos = [], avaliacoesExistentes = false, erros = {}, onSubmit, onCancelar }) {
  const [f, setF] = useState({
    nome: inicial.nome || "", inicio: inicial.inicio || "", fim: inicial.fim || "", instrumentoId: inicial.instrumentoId || "",
    projetosIds: inicial.projetosIds || [], avaliadoresIds: inicial.avaliadoresIds || [], pesos: inicial.pesos || {},
  });
  const instrumento = instrumentos.find((i) => String(i.id) === String(f.instrumentoId));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const alternar = (campo, id) =>
    setF({ ...f, [campo]: f[campo].includes(id) ? f[campo].filter((x) => x !== id) : [...f[campo], id] });

  const lista = (titulo, itens, campo) => (
    <fieldset>
      <legend><strong>{titulo}</strong></legend>
      {itens.length === 0 && <p className="muted">Nenhum item disponível.</p>}
      {itens.map((i) => (
        <label key={i.id} className="check">
          <input type="checkbox" checked={f[campo].includes(i.id)} onChange={() => alternar(campo, i.id)} /> {i.nome}
        </label>
      ))}
    </fieldset>
  );

  return (
    <>
      <PageHeader title={inicial.id ? "Editar banca" : "Nova banca"} />
      <Card>
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit?.(f); }}>
          <Input label="Nome da banca" name="nome" value={f.nome} onChange={set("nome")} error={erros.nome} required />
          <div className="grid-2">
            <Input label="Início" name="inicio" type="date" value={f.inicio} onChange={set("inicio")} required />
            <Input label="Fim" name="fim" type="date" value={f.fim} onChange={set("fim")} error={erros.fim} required />
          </div>
          <Select label="Instrumento de avaliação" name="instrumentoId" placeholder="Selecione" value={f.instrumentoId} onChange={set("instrumentoId")}
            options={instrumentos.map((i) => ({ value: i.id, label: i.nome }))} required />
          {instrumento && (
            <fieldset>
              <legend><strong>Pesos dos critérios nesta banca</strong></legend>
              <p className="field-hint">Deixe em branco para usar o peso padrão do instrumento.{avaliacoesExistentes && " Avaliações já enviadas mantêm os pesos vigentes no momento do envio."}</p>
              <div className="grid-4">
                {instrumento.criterios.map((c) => (
                  <Input key={c.id} label={`${c.titulo} (padrão ${c.peso})`} name={`peso-${c.id}`} type="number" step="0.1" min="0.1"
                    value={f.pesos[c.id] ?? ""} onChange={(e) => setF({ ...f, pesos: { ...f.pesos, [c.id]: e.target.value } })} />
                ))}
              </div>
            </fieldset>
          )}
          {lista("Projetos participantes", projetos, "projetosIds")}
          {lista("Avaliadores designados", avaliadores, "avaliadoresIds")}
          <div className="row">
            <Button type="submit">Salvar banca</Button>
            <Button variant="secondary" onClick={onCancelar}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
