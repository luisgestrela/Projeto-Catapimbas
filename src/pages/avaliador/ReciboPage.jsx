import { PageHeader, Card, DataTable, Button } from "../../components";

export default function ReciboPage({ recibo = {}, onVoltar }) {
  const colunas = [
    { key: "criterio", header: "Critério" },
    { key: "nota", header: "Nota" },
  ];
  return (
    <>
      <PageHeader title="Avaliação enviada" subtitle="Guarde o protocolo como comprovante."
        actions={<><Button variant="secondary" onClick={() => window.print()}>Imprimir</Button><Button onClick={onVoltar}>Voltar às bancas</Button></>} />
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
