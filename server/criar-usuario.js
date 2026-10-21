// Uso: npm run usuario -- <email> <senha> ["Nome"] [--superadmin] [--inst <identificador> --papel <codigo>]
// Cria o usuário ou redefine a senha (e reativa a conta) se o e-mail já existir.
// Com --inst e --papel, cria/atualiza também o vínculo ATIVO com a instituição.
import { gerarHash, papelValido } from "./auth.js";
import { consultar, supabase } from "./supabase.js";

const argv = process.argv.slice(2);
const opcao = (nome) => { const i = argv.indexOf(`--${nome}`); return i >= 0 ? argv[i + 1] : undefined; };
const is_superadmin = argv.includes("--is_superadmin");
const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--inst" || argv[i] === "--papel") i++;
  else if (!argv[i].startsWith("--")) pos.push(argv[i]);
}
const [emailBruto, senha, nome = "Usuário"] = pos;
const email = String(emailBruto || "").trim().toLowerCase();
const inst = opcao("inst");
const papel = opcao("papel");

if (!email || !senha || senha.length < 8 || (!!inst !== !!papel)) {
  console.error('Uso: npm run usuario -- <email> <senha 8+> ["Nome"] [is_superadmin] [--inst <identificador> --papel <administrador|coordenador|orientador|avaliador|aluno>]');
  process.exitCode = 1;
} else {
  const senha_hash = await gerarHash(senha);
  let usuario = await consultar(supabase.from("usuario").select("id").eq("email", email).maybeSingle());
  if (usuario) {
    await consultar(supabase.from("usuario").update({
      senha_hash, status: "ativo", bloqueado_ate: null, tentativas_login_falhas: 0, anonimizado_em: null,
      ...(is_superadmin ? { is_superadmin: true } : {}),
    }).eq("id", usuario.id));
    console.log(`Usuário ${email} atualizado (id ${usuario.id}). Senha redefinida.`);
  } else {
    usuario = await consultar(supabase.from("usuario").insert({ nome, email, senha_hash, is_superadmin }).select("id").single());
    console.log(`Usuário ${email} criado (id ${usuario.id})${is_superadmin ? " como is_superadmin" : ""}.`);
  }

  if (inst) {
    const i = await consultar(supabase.from("instituicao").select("id").eq("identificador", inst).maybeSingle());
    if (!i) { console.error(`Instituição "${inst}" não encontrada.`); process.exitCode = 1; }
    else {
      const campos = { papel: await papelValido(papel), situacao: "ativo", justificativa: null, decidido_em: new Date().toISOString(), decidido_por: usuario.id };
      const v = await consultar(supabase.from("vinculo_institucional").select("id").eq("instituicao_id", i.id).eq("usuario_id", usuario.id).maybeSingle());
      if (v) await consultar(supabase.from("vinculo_institucional").update(campos).eq("id", v.id));
      else await consultar(supabase.from("vinculo_institucional").insert({ instituicao_id: i.id, usuario_id: usuario.id, ...campos }));
      console.log(`Vínculo ativo: ${email} → ${inst} como ${papel}.`);
    }
  }
}
