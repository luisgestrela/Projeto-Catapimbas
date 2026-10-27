// Diagnóstico da conexão com o Supabase. Uso: npm run db:check
let supabase;
try {
  ({ supabase } = await import("./supabase.js"));
} catch (e) {
  console.error("\n✖ Configuração inválida:", e.message);
  console.error("  Confira o arquivo .env (use .env.example como modelo).\n");
  process.exit(1);
}

const { count, error, status } = await supabase.from("instituicao").select("id", { count: "exact", head: true });
if (error) {
  console.error("\n✖ Falha na conexão com o Supabase:", error.message || `HTTP ${status}`);
  if (status === 401 || /invalid api key/i.test(error.message || "")) {
    console.error("  → A SUPABASE_SERVICE_ROLE_KEY está incorreta ou é de outro projeto.");
  } else if (error.code === "42501" || status === 403) {
    console.error("  → Sem permissão: você provavelmente usou a chave anon/publishable em vez da secreta.");
  } else if (error.code === "42P01" || error.code === "PGRST205") {
    console.error("  → Tabelas não encontradas: aplique as migrações de supabase/migrations.");
  } else if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(error.message || "") || status === 0) {
    console.error("  → Não foi possível alcançar a URL. Confira SUPABASE_URL e sua internet.");
  }
  console.error("");
  process.exit(1);
}
console.log(`✔ Conexão com o Supabase OK. Instituições cadastradas: ${count}`);

// Confere se as migrações usadas pelo código já foram aplicadas (causa comum de "Erro interno" na API).
let pendencias = 0;
const aviso = (msg) => { pendencias++; console.error(`✖ ${msg}`); };

const perm = await supabase.from("papel_permissao").select("papel_codigo", { count: "exact", head: true });
if (perm.error) aviso(`Tabela papel_permissao inacessível (${perm.error.message}). Aplique 20261021000000_schema.sql.`);
else if (!perm.count) aviso("papel_permissao está vazia: todas as rotas protegidas retornarão 403.");

const colunas = await supabase.from("projeto").select("curso, data_realizacao", { head: true });
if (colunas.error) aviso("projeto.curso/data_realizacao não existem. Aplique supabase/migrations/20261026000000_projeto_curso_data.sql e rode: notify pgrst, 'reload schema';");

const usuarios = await supabase.from("usuario").select("ultimo_login_em, tentativas_login_falhas, bloqueado_ate, anonimizado_em", { head: true });
if (usuarios.error) aviso("Colunas de login em usuario ausentes. Aplique 20261021000100_backend_colunas.sql.");

if (pendencias) process.exit(1);
console.log("✔ Tabelas e colunas esperadas pelo backend encontradas.");
