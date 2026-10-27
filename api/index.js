// Função serverless da Vercel: toda requisição /api/* chega aqui (ver vercel.json).
// O app é carregado sob demanda para que uma configuração inválida (variável de ambiente ausente ou
// chave do Supabase errada) devolva um JSON legível em vez de derrubar a função com um 500 opaco.
let carregando;

const carregarApp = () => (carregando ??= import("../server/app.js").then((m) => m.default));

export default async function handler(req, res) {
  let app;
  try {
    app = await carregarApp();
  } catch (e) {
    carregando = undefined; // tenta de novo na próxima requisição (ex.: após corrigir as variáveis na Vercel)
    console.error("Falha ao iniciar a API:", e);
    // As mensagens de config.js só citam o nome da variável, nunca o valor.
    const configuracao = /Variável de ambiente|SUPABASE_|JWT_SECRET/.test(e?.message || "");
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ erro: configuracao ? `Configuração da API inválida: ${e.message}` : "Erro interno ao iniciar a API." }));
    return;
  }
  return app(req, res);
}
