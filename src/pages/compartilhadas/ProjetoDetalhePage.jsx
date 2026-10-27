import { formatarData } from "../../utils/filtroProjetos";
import { PageHeader, Card, Badge, DataTable, Button } from "../../components";

export default function ProjetoDetalhePage({ projeto = {}, podeEditar = false, onEditar, onVoltar }) {
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
