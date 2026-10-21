import { supabase } from "./supabase.js";

const { count, error } = await supabase.from("instituicao").select("id", { count: "exact", head: true });
if (error) {
  console.error("Falha na conexão com o Supabase:", error.message);
  process.exit(1);
}
console.log(`Conexão com o Supabase OK. Instituições cadastradas: ${count}`);
