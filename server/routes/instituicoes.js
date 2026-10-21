import { Router } from "express";
import { autenticar, contexto, exigeSuperadmin } from "../auth.js";
import { auditar } from "../auditoria.js";
import { mapearInstituicao } from "../estado.js";
import { ErroHttp, consultar, supabase } from "../supabase.js";
import { inteiro, invalido, opcao, texto } from "../validar.js";

const r = Router();

r.get("/publicas", async (_req, res) => {
  const linhas = await consultar(supabase.from("instituicao").select("id, nome").eq("status", "ativa").order("nome"));
  res.json(linhas);
});

r.use(autenticar, contexto, exigeSuperadmin);

function dadosInstituicao(b) {
  const identificador = texto(b?.identificador, "identificador", { min: 2, max: 40 }).toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(identificador)) throw invalido("Identificador inválido.", { identificador: "Use letras minúsculas, números e hífen." });
  const cor = String(b?.corPrimaria || "#0f5e73");
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) throw invalido("Cor inválida.");
  const logo = String(b?.logoUrl || "").trim();
  if (logo && !/^https?:\/\//i.test(logo)) throw invalido("URL do logotipo inválida.");
  return {
    nome: texto(b?.nome, "nome", { min: 2, max: 120 }), identificador, status: opcao(b?.status || "ativa", "status", ["ativa", "suspensa"]),
    cor_primaria: cor, logo_url: logo || null,
  };
}

const duplicado = (e) => (e.status === 409 ? new ErroHttp(409, "Já existe uma instituição com este identificador.", { identificador: "Já existe uma instituição com este identificador." }) : e);

r.post("/", async (req, res) => {
  const dados = dadosInstituicao(req.body);
  const nova = await consultar(supabase.from("instituicao").insert(dados).select("*").single()).catch((e) => { throw duplicado(e); });
  await auditar(req, nova.id, "instituicao", nova.nome, "Instituição cadastrada");
  res.status(201).json(mapearInstituicao(nova));
});

r.put("/:id", async (req, res) => {
  const id = inteiro(req.params.id, "id");
  const dados = dadosInstituicao(req.body);
  const atual = await consultar(supabase.from("instituicao").update(dados).eq("id", id).select("*").maybeSingle()).catch((e) => { throw duplicado(e); });
  if (!atual) throw new ErroHttp(404, "Instituição não encontrada.");
  await auditar(req, id, "instituicao", atual.nome, "Instituição editada");
  res.json(mapearInstituicao(atual));
});

r.patch("/:id/status", async (req, res) => {
  const id = inteiro(req.params.id, "id");
  const status = opcao(req.body?.status, "status", ["ativa", "suspensa"]);
  const atual = await consultar(supabase.from("instituicao").update({ status }).eq("id", id).select("*").maybeSingle());
  if (!atual) throw new ErroHttp(404, "Instituição não encontrada.");
  await auditar(req, id, "instituicao", atual.nome, `Status alterado para ${status}`);
  res.json(mapearInstituicao(atual));
});

export default r;
