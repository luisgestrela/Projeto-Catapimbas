import { useState } from "react";
import { PageHeader, Card, Input, Select, Button, InstrumentoAjuda } from "../../components";

export default function BancaFormPage({
  inicial = {}, projetos = [], avaliadores = [], instrumentos = [], avaliacoesExistentes = false, erros = {},
  podeCriarInstrumento = false, onIrParaCriterios, onSubmit, onCancelar,
}) {
  const [f, setF] = useState({
    nome: inicial.nome || "", inicio: inicial.inicio || "", fim: inicial.fim || "", instrumentoId: inicial.instrumentoId || "",
    projetosIds: inicial.projetosIds || [], avaliadoresIds: inicial.avaliadoresIds || [], pesos: inicial.pesos || {},
  });
  const instrumento = instrumentos.find((i) => String(i.id) === String(f.instrumentoId));
  const usaveis = instrumentos.filter((i) => (i.criterios || []).length > 0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const alternar = (campo, id) =>
    setF({ ...f, [campo]: f[campo].includes(id) ? f[campo].filter((x) => x !== id) : [...f[campo], id] });

  const lista = (titulo, itens, campo, vazio) => (
    <fieldset>
      <legend><strong>{titulo}</strong></legend>
      {itens.length === 0 && <p className="muted">{vazio || "Nenhum item disponível."}</p>}
      {itens.map((i) => (
        <label key={i.id} className="check">
          <input type="checkbox" checked={f[campo].includes(i.id)} onChange={() => alternar(campo, i.id)} /> {i.nome}
        </label>
      ))}
    </fieldset>
  );

  const semInstrumento = instrumentos.length === 0;
  const nenhumUsavel = !semInstrumento && usaveis.length === 0;
  const botaoCriterios = podeCriarInstrumento && (
    <Button onClick={onIrParaCriterios}>{semInstrumento ? "Criar instrumento de avaliação" : "Adicionar critérios"}</Button>
  );

  return (
    <>
      <PageHeader title={inicial.id ? "Editar banca" : "Nova banca"}
        subtitle="Uma banca é um evento de avaliação: defina quando acontece, o que será avaliado, quais projetos participam e quem avalia." />
      <Card>
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit?.(f); }}>
          <Input label="Nome da banca" name="nome" value={f.nome} onChange={set("nome")} error={erros.nome} hint="Ex.: Banca final 2026.2" required />
          <div className="grid-2">
            <Input label="Início" name="inicio" type="date" value={f.inicio} onChange={set("inicio")} required />
            <Input label="Fim" name="fim" type="date" value={f.fim} onChange={set("fim")} error={erros.fim} hint="Os avaliadores só conseguem enviar notas dentro deste período." required />
          </div>

          <div className="instrumento-box">
            <InstrumentoAjuda compacto />
            {semInstrumento ? (
              <div className="alert alert-aviso" role="status">
                <strong>Sua instituição ainda não tem nenhum instrumento de avaliação.</strong>
                <p>Sem um instrumento a banca não tem o que avaliar. {podeCriarInstrumento
                  ? "Crie o primeiro na aba Critérios e depois volte para criar a banca."
                  : "Peça ao administrador da instituição para criar um na aba Critérios."}</p>
                {botaoCriterios}
              </div>
            ) : (
              <>
                {nenhumUsavel && (
                  <div className="alert alert-aviso" role="status">
                    <strong>Os instrumentos existentes ainda não têm critérios.</strong>
                    <p>{podeCriarInstrumento ? "Adicione ao menos um critério na aba Critérios para poder usá-los." : "Peça ao administrador para adicionar critérios na aba Critérios."}</p>
                    {botaoCriterios}
                  </div>
                )}
                <Select label="Instrumento de avaliação" name="instrumentoId" placeholder="Selecione o instrumento" value={f.instrumentoId} onChange={set("instrumentoId")}
                  options={instrumentos.map((i) => ({ value: i.id, label: (i.criterios || []).length ? i.nome : `${i.nome} (sem critérios)`, disabled: !(i.criterios || []).length }))}
                  hint={instrumento ? undefined : "É a ficha de notas que os avaliadores vão preencher."} required />
                {instrumento && (
                  <p className="field-hint">
                    {instrumento.descricao ? `${instrumento.descricao} ` : ""}
                    {instrumento.criterios.length} {instrumento.criterios.length === 1 ? "critério" : "critérios"}: {instrumento.criterios.map((c) => c.titulo).join(", ")}.
                  </p>
                )}
              </>
            )}
          </div>

          {instrumento && (
            <fieldset>
              <legend><strong>Pesos dos critérios nesta banca</strong></legend>
              <p className="field-hint">Peso é quanto cada critério conta na nota final. Deixe em branco para usar o peso padrão do instrumento.{avaliacoesExistentes && " Avaliações já enviadas mantêm os pesos vigentes no momento do envio."}</p>
              <div className="grid-4">
                {instrumento.criterios.map((c) => (
                  <Input key={c.id} label={`${c.titulo} (padrão ${c.peso})`} name={`peso-${c.id}`} type="number" step="0.1" min="0.1"
                    value={f.pesos[c.id] ?? ""} onChange={(e) => setF({ ...f, pesos: { ...f.pesos, [c.id]: e.target.value } })} />
                ))}
              </div>
            </fieldset>
          )}
          {lista("Projetos participantes", projetos, "projetosIds", "Nenhum projeto ativo. Cadastre projetos na aba Projetos.")}
          {lista("Avaliadores designados", avaliadores, "avaliadoresIds", "Nenhum avaliador aprovado. Aprove pedidos na aba Aprovações ou mude o papel de alguém em Pessoas e permissões.")}
          <div className="row">
            <Button type="submit" disabled={semInstrumento || nenhumUsavel}>Salvar banca</Button>
            <Button variant="secondary" onClick={onCancelar}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
