// Barra de progresso com texto: o número sempre aparece por escrito, a cor é só reforço.
export default function Progresso({ feitos = 0, total = 0, rotulo = "Progresso" }) {
  const pct = total > 0 ? Math.min(100, Math.round((feitos / total) * 100)) : 0;
  return (
    <div className="progresso" role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(feitos, total)}
      aria-valuetext={`${feitos} de ${total}`}>
      <div className="progresso-trilho"><div className={`progresso-barra${total > 0 && feitos >= total ? " completo" : ""}`} style={{ width: `${pct}%` }} /></div>
      <span className="progresso-texto">{pct}%</span>
    </div>
  );
}
