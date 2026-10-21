import "dotenv/config";

const exigir = (nome) => {
  const valor = (process.env[nome] || "").trim();
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return valor;
};

const supabaseUrl = exigir("SUPABASE_URL").replace(/\/+$/, "");
const supabaseServiceKey = exigir("SUPABASE_SERVICE_ROLE_KEY");
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || "").trim();

if (!/^https:\/\/.+\.supabase\.co$/.test(supabaseUrl) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(supabaseUrl)) {
  throw new Error("SUPABASE_URL inválida (use https://<projeto>.supabase.co).");
}
// A service role precisa ser diferente da anon key; com a anon key o RLS bloqueia todas as consultas do servidor.
if (supabaseAnonKey && supabaseAnonKey === supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY está igual à SUPABASE_ANON_KEY. Use a chave service_role/secret.");
}
if (supabaseServiceKey.startsWith("sb_publishable_")) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY contém uma chave publicável. Use a chave secreta (sb_secret_...) ou service_role.");
}

export const config = {
  // 5432 é a porta do PostgreSQL; a API usa 3001 por padrão.
  porta: Number(process.env.PORT) || 3001,
  producao: process.env.NODE_ENV === "production",
  origem: process.env.CORS_ORIGIN || "http://localhost:5173",
  supabaseUrl,
  supabaseServiceKey,
  supabaseAnonKey,
  jwtSecret: exigir("JWT_SECRET"),
};
