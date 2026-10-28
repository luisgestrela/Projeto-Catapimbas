import { useState } from "react";
import Input from "./Input";
import Textarea from "./Textarea";
import Button from "./Button";
import { rotulosEscala } from "../utils/escala";

export default function CriterioForm({ inicial = {}, onSubmit, onCancel }) {
  const [titulo, setTitulo] = useState(inicial.titulo || "");
  const [descricao, setDescricao] = useState(inicial.descricao || "");
  const [peso, setPeso] = useState(inicial.peso ?? 1);
  const [min, setMin] = useState(inicial.escala?.min ?? 1);
  const [max, setMax] = useState(inicial.escala?.max ?? 5);
  const [descritores, setDescritores] = useState(inicial.descritores || {});
  const [erro, setErro] = useState("");

  const escalaValida = Number.isInteger(Number(min)) && Number.isInteger(Number(max)) && Number(max) > Number(min) && Number(max) - Number(min) <= 20;
  const faixas = escalaValida ? Array.from({ length: Number(max) - Number(min) + 1 }, (_, i) => Number(min) + i) : [];
  const sugestoes = rotulosEscala(min, max);
  const faltando = faixas.filter((n) => !String(descritores[n] || "").trim());

  function preencherSugestoes() {
    setDescritores((atual) => {
      const novo = { ...atual };
      for (const n of faixas) if (!String(novo[n] || "").trim()) novo[n] = sugestoes[n];
      return novo;
    });
  }

  function enviar(e) {
    e.preventDefault();
    if (!titulo.trim()) return setErro("Informe o título do critério.");
    if (!(Number(peso) > 0)) return setErro("O peso deve ser maior que zero.");
    if (!escalaValida) return setErro("A nota máxima deve ser maior que a mínima.");
    setErro("");
    onSubmit?.({ titulo: titulo.trim(), descricao, peso: Number(peso), escala: { min: Number(min), max: Number(max) }, descritores });
  }

  return (
    <form className="form" onSubmit={enviar}>
      {erro && <div className="alert" role="alert">{erro}</div>}
      <Input label="Título do critério" name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)}
        hint="O nome que o avaliador verá. Ex.: Clareza do problema." required />
      <Textarea label="O que está sendo avaliado (opcional)" name="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2}
        hint="Uma frase explicando o critério para quem vai dar a nota." />
      <div className="grid-4">
        <Input label="Peso" name="peso" type="number" step="0.1" min="0.1" value={peso} onChange={(e) => setPeso(e.target.value)}
          hint="Quanto maior, mais conta na nota final." />
        <Input label="Menor nota" name="min" type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
        <Input label="Maior nota" name="max" type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
      </div>

      <fieldset className="descritores">
        <legend><strong>O que significa cada nota</strong></legend>
        <p className="field-hint">Escreva, para cada nota, o que o projeto precisa ter mostrado. O avaliador lê esse texto antes de escolher.</p>
        {!escalaValida && <p className="field-error">Ajuste a escala acima para ver as notas.</p>}
        {faltando.length > 0 && escalaValida && (
          <div><Button variant="secondary" size="sm" onClick={preencherSugestoes}>Preencher notas vazias com sugestões</Button></div>
        )}
        {faixas.map((n) => (
          <Textarea key={n} label={`Nota ${n} — ${sugestoes[n]}`} name={`descritor-${n}`} rows={2} value={descritores[n] || ""}
            placeholder={sugestoes[n]} onChange={(e) => setDescritores({ ...descritores, [n]: e.target.value })} />
        ))}
      </fieldset>

      <div className="row">
        <Button type="submit">Salvar critério</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
