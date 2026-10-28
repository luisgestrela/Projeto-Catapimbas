const BASE = import.meta.env.VITE_API_URL || "/api";

let instituicaoAtual = null;
export const definirInstituicao = (id) => { instituicaoAtual = id; };
export const obterInstituicao = () => instituicaoAtual;

export class ApiErro extends Error {
  constructor(status, mensagem, campos) {
    super(mensagem);
    this.status = status;
    this.campos = campos;
  }
}

async function requisitar(metodo, caminho, corpo) {
  const headers = { "X-CSRF": "1" };
  if (corpo !== undefined) headers["Content-Type"] = "application/json";
  if (instituicaoAtual) headers["X-Instituicao-Id"] = String(instituicaoAtual);
  let resposta;
  try {
    resposta = await fetch(`${BASE}${caminho}`, { method: metodo, credentials: "include", headers, body: corpo !== undefined ? JSON.stringify(corpo) : undefined });
  } catch {
    throw new ApiErro(0, "Não foi possível conectar ao servidor.");
  }
  if (!resposta.ok) {
    let dados = {};
    try { dados = await resposta.json(); } catch { dados = {}; }
    throw new ApiErro(resposta.status, dados.erro || "Erro inesperado.", dados.campos);
  }
  return resposta;
}

const json = async (metodo, caminho, corpo) => (await requisitar(metodo, caminho, corpo)).json();

export async function baixar(caminho, nomeArquivo) {
  const resposta = await requisitar("GET", caminho);
  const url = URL.createObjectURL(await resposta.blob());
  const a = Object.assign(document.createElement("a"), { href: url, download: nomeArquivo });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const api = {
  get: (c) => json("GET", c),
  post: (c, corpo = {}) => json("POST", c, corpo),
  put: (c, corpo) => json("PUT", c, corpo),
  patch: (c, corpo) => json("PATCH", c, corpo),
  del: (c) => json("DELETE", c),
  baixar,
};
