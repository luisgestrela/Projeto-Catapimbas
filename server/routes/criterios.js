import { Router } from "express";
import { auditar } from "../auditoria.js";
import { exigeInstituicao, exigePermissao } from "../auth.js";
import { consultar, rpc, supabase } from "../supabase.js";
import { inteiro, invalido, texto } from "../validar.js";

const r = Router();
r.use(exigeInstituicao, exigePermissao("criterio:gerir"));

r.post("/", async (req, res) => {
  const nome = texto(req.body?.nome, "nome", { min: 2, max: 120 });
  const novo = await consultar(
    supabase.from("instrumento").insert({ instituicao_id: req.instituicaoId, nome, criado_por: req.usuario.id }).select("id").single(),
  );
  await auditar(req, req.instituicaoId, "criterio", nome, "Instrumento criado");
  res.status(201).json({ id: novo.id });
});

r.post("/:id/criterios", async (req, res) => {
  const instrumentoId = inteiro(req.params.id, "id");
  const b = req.body || {};
  const min = inteiro(b.escala?.min ?? 1, "escala.min", { min: 0, max: 100 });
  const max = inteiro(b.escala?.max ?? 5, "escala.max", { min: 1, max: 100 });
  if (min >= max) throw invalido("A escala deve ter mínimo menor que o máximo.");
  const peso = Number(b.peso);
  if (!Number.isFinite(peso) || peso <= 0 || peso > 9999) throw invalido("O peso deve ser maior que zero.");
  const descritores = {};
  for (const [k, v] of Object.entries(b.descritores && typeof b.descritores === "object" ? b.descritores : {})) {
    const n = Number(k);
    if (Number.isInteger(n) && n >= min && n <= max && typeof v === "string" && v.trim()) descritores[n] = v.trim().slice(0, 1000);
  }
  const dados = {
    titulo: texto(b.titulo, "titulo", { min: 2, max: 160 }), descricao: texto(b.descricao, "descricao", { max: 1000, obrigatorio: false }),
    peso, escala: { min, max }, descritores,
  };
  const id = await rpc("salvar_criterio", {
    p_inst: req.instituicaoId, p_instrumento: instrumentoId, p_versao_id: b.id ? inteiro(b.id, "id") : null, p_dados: dados, p_ator: req.usuario.id,
  });
  res.status(201).json({ id });
});

export default r;
