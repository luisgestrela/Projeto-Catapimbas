import { Router } from "express";
import { exigeInstituicao, exigePermissao } from "../auth.js";
import { ErroHttp, consultar, rpc, supabase } from "../supabase.js";
import { inteiro, listaIds, opcao, texto } from "../validar.js";

const r = Router();
r.use(exigeInstituicao);

function dadosProjeto(req) {
  const b = req.body || {};
  const orientadorId = req.papel === "orientador" ? req.usuario.id : b.orientadorId ? inteiro(b.orientadorId, "orientadorId") : null;
  return {
    nome: texto(b.nome, "nome", { min: 2, max: 160 }),
    descricao: texto(b.descricao, "descricao", { max: 2000, obrigatorio: false }),
    status: opcao(b.status || "ativo", "status", ["ativo", "arquivado"]),
    ano: inteiro(b.ano, "ano", { min: 2000, max: 2100 }),
    semestre: opcao(String(b.semestre), "semestre", ["1", "2"]),
    equipe: texto(b.equipe, "equipe", { max: 120, obrigatorio: false }),
    orientadorId,
    alunosIds: listaIds(b.alunosIds, "alunosIds"),
  };
}

r.post("/", exigePermissao("projeto:criar"), async (req, res) => {
  const id = await rpc("salvar_projeto", { p_inst: req.instituicaoId, p_id: null, p_dados: dadosProjeto(req), p_ator: req.usuario.id });
  res.status(201).json({ id });
});

r.put("/:id", exigePermissao("projeto:editar"), async (req, res) => {
  const id = inteiro(req.params.id, "id");
  if (req.papel === "orientador") {
    const o = await consultar(
      supabase.from("orientacao").select("orientador_id").eq("projeto_id", id).eq("instituicao_id", req.instituicaoId).maybeSingle(),
    );
    if (!o || o.orientador_id !== req.usuario.id) throw new ErroHttp(404, "Registro não encontrado.");
  }
  await rpc("salvar_projeto", { p_inst: req.instituicaoId, p_id: id, p_dados: dadosProjeto(req), p_ator: req.usuario.id });
  res.json({ id });
});

export default r;
