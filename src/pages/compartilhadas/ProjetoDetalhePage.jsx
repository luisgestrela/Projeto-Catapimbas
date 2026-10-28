import { formatarData } from "../../utils/filtroProjetos";
import { PageHeader, Card, Badge, DataTable, Button, ProjetoAcessoRapido } from "../../components";

const colunasResultados = (onVer) => [
  { key: "banca", header: "Banca" },
  { key: "periodo", header: "Período" },
  { key: "posicao", header: "Posição", render: (r) => (r.posicao ? `${r.posicao}º de ${r.total}${r.empatado ? " (empate)" : ""}` : "—") },
  { key: "pontuacao", header: "Pontuação", render: (r) => (r.posicao ? r.pontuacao.toFixed(2) : "—") },
  { key: "avaliacoes", header: "Avaliações", render: (r) => `${r.avaliacoes} de ${r.previstas}` },
  { key: "resultado", header: "Resultado", render: (r) => <Badge status={r.resultado} /> },
  { key: "acoes", header: "", render: (r) => <Button variant="secondary" size="sm" onClick={() => onVer?.(r.id)}>Ver resultados</Button> },
];

export default function ProjetoDetalhePage({ projeto = {}, podeEditar = false, podeGerarAcesso = false, onGerarLink, onEditar, onVoltar, onVerResultados }) {
  const colunas = [
    { key: "nome", header: "Nome" },
    { key: "funcao", header: "Função" },
    ...(projeto.integrantes?.some((i) => i.email) ? [{ key: "email", header: "E-mail" }] : []),
    ...(projeto.integrantes?.some((i) => i.instituicao) ? [{ key: "instituicao", header: "Universidade" }] : []),
  ];
  return (
    <>
      <PageHeader title={projeto.nome || "Projeto"} subtitle={`${projeto.ano || ""}/${projeto.semestre || ""}${projeto.instituicao ? ` · ${projeto.instituicao}` : ""}`}
        actions={<><Button variant="secondary" onClick={onVoltar}>Voltar</Button>{podeEditar && <Button onClick={onEditar}>Editar</Button>}</>} />
      {podeGerarAcesso && <ProjetoAcessoRapido projetoId={projeto.id} projetoNome={projeto.nome} bancas={projeto.bancas} podeGerar onGerarLink={onGerarLink} />}
      <Card title="Resumo" actions={<Badge status={projeto.status} />}>
        <p>{projeto.descricao || "Sem descrição."}</p>
        <p><strong>Orientador:</strong> {projeto.orientador || "—"}</p>
        <p><strong>Curso:</strong> {projeto.curso || "—"}</p>
        <p><strong>Data de realização:</strong> {formatarData(projeto.dataRealizacao) || "—"}</p>
        <p><strong>Equipe:</strong> {projeto.equipe || "—"}</p>
      </Card>
      <Card title="Integrantes">
        <DataTable columns={colunas} rows={projeto.integrantes || []} emptyTitle="Nenhum integrante associado" />
      </Card>
      {projeto.resultados && (
        <Card title="Avaliações e resultados">
          <DataTable columns={colunasResultados(onVerResultados)} rows={projeto.resultados} emptyTitle="Este projeto ainda não está em nenhuma banca" />
        </Card>
      )}
      {projeto.bancas && (
        <Card title="Participação em bancas">
          {projeto.bancas.length === 0 ? <p className="muted">Este projeto ainda não está em nenhuma banca.</p> : (
            <ul className="lista-simples">
              {projeto.bancas.map((b) => (
                <li key={b.id} className="row" style={{ justifyContent: "space-between" }}>
                  <span><strong>{b.nome}</strong> <span className="muted">{b.periodo}</span></span>
                  <Badge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  );
}
