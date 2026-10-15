import { useState } from "react";
import Input from "./Input";
import Textarea from "./Textarea";
import Button from "./Button";

export default function CriterioForm({ inicial = {}, onSubmit, onCancel }) {
  const [titulo, setTitulo] = useState(inicial.titulo || "");
  const [descricao, setDescricao] = useState(inicial.descricao || "");
  const [peso, setPeso] = useState(inicial.peso ?? 1);
  const [min, setMin] = useState(inicial.escala?.min ?? 1);
  const [max, setMax] = useState(inicial.escala?.max ?? 5);
  const [descritores, setDescritores] = useState(inicial.descritores || {});
  const [erro, setErro] = useState("");

  const faixas = Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => Number(min) + i);

  function enviar(e) {
    e.preventDefault();
    if (!titulo.trim()) return setErro("Informe o título do critério.");
    if (Number(peso) <= 0) return setErro("O peso deve ser maior que zero.");
    if (Number(max) <= Number(min)) return setErro("A nota máxima deve ser maior que a mínima.");
    setErro("");
    onSubmit?.({ titulo: titulo.trim(), descricao, peso: Number(peso), escala: { min: Number(min), max: Number(max) }, descritores });
  }

  return (
    <form className="form" onSubmit={enviar}>
      {erro && <div className="alert" role="alert">{erro}</div>}
      <Input label="Título" name="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
      <Textarea label="Descrição" name="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
      <div className="grid-4">
        <Input label="Peso" name="peso" type="number" step="0.1" min="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} />
        <Input label="Nota mínima" name="min" type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
        <Input label="Nota máxima" name="max" type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
      </div>
      <h3>Descritores por faixa de nota</h3>
      {faixas.map((n) => (
        <Textarea key={n} label={`Nota ${n}`} name={`descritor-${n}`} rows={2} value={descritores[n] || ""}
          onChange={(e) => setDescritores({ ...descritores, [n]: e.target.value })} />
      ))}
      <div className="row">
        <Button type="submit">Salvar critério</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}
