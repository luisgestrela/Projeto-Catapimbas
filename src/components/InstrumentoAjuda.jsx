// Explica, em linguagem simples, o que é um instrumento de avaliação.
// Usado na tela de critérios e no formulário de banca.
export default function InstrumentoAjuda({ compacto = false }) {
  return (
    <aside className="ajuda" aria-label="O que é um instrumento de avaliação">
      <h3>O que é um instrumento de avaliação?</h3>
      <p>
        É a ficha que os avaliadores preenchem para dar nota aos projetos de uma banca. Ele reúne os <strong>critérios</strong> (o que será avaliado,
        como “Clareza do problema”), cada um com um <strong>peso</strong> (quanto conta na nota final) e uma escala de notas explicada.
      </p>
      {!compacto && (
        <p className="muted">Crie o instrumento uma vez e use em quantas bancas quiser. Se você mudar um critério depois, as avaliações já enviadas continuam como estavam.</p>
      )}
    </aside>
  );
}
