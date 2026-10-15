const TONES = {
  ativo: "success", ativa: "success", aprovado: "success", publicado: "success", concluida: "success", valida: "success",
  pendente: "warning", rascunho: "neutral", em_andamento: "warning",
  recusado: "danger", suspensa: "danger", suspenso: "danger", bloqueado: "danger", revogado: "danger", invalida: "danger",
  aberta: "info", encerrada: "neutral", arquivado: "neutral", empate: "warning",
};
export default function Badge({ status, tone, children }) {
  const t = tone || TONES[String(status || "").toLowerCase()] || "neutral";
  return <span className={`badge badge-${t}`}>{children ?? status}</span>;
}
