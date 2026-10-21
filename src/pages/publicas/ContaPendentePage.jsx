import { AuthLayout, Badge, Button } from "../../components";

export default function ContaPendentePage({ status = "pendente", justificativa, onSair }) {
  const recusada = status === "recusado";
  return (
    <AuthLayout title={recusada ? "Solicitação recusada" : "Aguardando aprovação"}>
      <p><Badge status={status} /></p>
      {recusada ? (
        <>
          <p>O administrador da instituição recusou sua solicitação.</p>
          {justificativa && <div className="alert"><strong>Justificativa:</strong> {justificativa}</div>}
        </>
      ) : (
        <p>Sua solicitação foi recebida. Você terá acesso às áreas da plataforma assim que for aprovado.</p>
      )}
      <Button variant="secondary" onClick={onSair}>Sair</Button>
    </AuthLayout>
  );
}
