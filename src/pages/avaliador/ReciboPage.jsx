import { PageHeader, Card, DataTable, Button } from "../../components";

// `pendentes`: quantos projetos da banca ainda esperam a nota deste avaliador. `onProximo` abre o próximo pendente.
export default function ReciboPage({ recibo = {}, pendentes = 0, onProximo, onVoltar }) {
  const colunas = [
    { key: "criterio", header: "Critério" },
    { key: "nota", header: "Nota" },
  ];
  return (
    <>
      <PageHeader title="Avaliação salva" subtitle="Guarde o protocolo como comprovante."
        actions={<>
          <Button variant="secondary" onClick={() => window.print()}>Imprimir</Button>
          {pendentes > 0 && <Button onClick={onProximo}>Avaliar próximo projeto</Button>}
          <Button variant={pendentes > 0 ? "secondary" : "primary"} onClick={onVoltar}>Voltar às bancas</Button>
        </>} />
      <div className="alert alert-ok confirmacao" role="status">
        <strong>Avaliação salva com sucesso.</strong>{" "}
        {recibo.projeto ? <>Sua avaliação de <strong>{recibo.projeto}</strong> foi registrada com o protocolo <strong>{recibo.protocolo || "—"}</strong>.</> : "Sua avaliação foi registrada."}{" "}
        {pendentes > 0
          ? `Ainda ${pendentes === 1 ? "falta 1 projeto" : `faltam ${pendentes} projetos`} para você avaliar nesta banca.`
          : "Você avaliou todos os projetos desta banca."}
      </div>
      <Card title={`Protocolo ${recibo.protocolo || "—"}`}>
        <p><strong>Banca:</strong> {recibo.banca}</p>
        <p><strong>Projeto:</strong> {recibo.projeto}</p>
        <p><strong>Avaliador:</strong> {recibo.avaliador}</p>
        <p><strong>Enviada em:</strong> {recibo.data}</p>
        <DataTable columns={colunas} rows={(recibo.notas || []).map((n, i) => ({ id: i, ...n }))} rowKey="id" />
      </Card>
    </>
  );
}
