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
