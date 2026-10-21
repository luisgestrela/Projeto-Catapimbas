import { AuthLayout, Button } from "../../components";

const MENSAGENS = {
  403: { titulo: "Acesso negado", texto: "Você não tem permissão para ver esta página." },
  404: { titulo: "Página não encontrada", texto: "O endereço não existe ou o conteúdo não está disponível para você." },
};

export default function ErroPage({ codigo = 404, voltarHref = "/" }) {
  const m = MENSAGENS[codigo] || MENSAGENS[404];
  return (
    <AuthLayout title={`${codigo} — ${m.titulo}`}>
      <p>{m.texto}</p>
      <Button href={voltarHref}>Voltar ao início</Button>
    </AuthLayout>
  );
}
