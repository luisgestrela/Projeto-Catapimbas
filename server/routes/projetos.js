import { Router } from "express";
import { exigePermissao } from "../auth.js";
import { ErroHttp, consultar, rpc, supabase } from "../supabase.js";
import { dataIso, inteiro, listaIds, opcao, texto } from "../validar.js";

const r = Router();

// Dentro de uma instituição o contexto vem do cabeçalho. O superadmin também pode cadastrar/editar projetos direto da
// plataforma, indicando a instituição no corpo (POST) ou pela própria instituição do projeto (PUT).
async function comInstituicao(req, _res, next) {
  try {
    if (req.instituicaoId) return next();
    if (!req.usuario.superadmin) throw new ErroHttp(403, "Selecione uma instituição.");
    let id = req.body?.instituicaoId ? inteiro(req.body.instituicaoId, "instituicaoId") : null;
    if (!id && req.params.id) {
      const p = await consultar(supabase.from("projeto").select("instituicao_id").eq("id", inteiro(req.params.id, "id")).maybeSingle());
      id = p?.instituicao_id ?? null;
    }
    if (!id) throw new ErroHttp(400, "Informe a instituição do projeto.", { instituicaoId: "Escolha a instituição." });
    const inst = await consultar(supabase.from("instituicao").select("id").eq("id", id).maybeSingle());
    if (!inst) throw new ErroHttp(404, "Instituição não encontrada.");
    req.instituicaoId = id;
    next();
  } catch (e) {
    next(e);
  }
}

function dadosProjeto(req) {
  const b = req.body || {};
  const orientadorId = b.orientadorId ? inteiro(b.orientadorId, "orientadorId") : null;
  return {
    nome: texto(b.nome, "nome", { min: 2, max: 160 }),
    descricao: texto(b.descricao, "descricao", { max: 2000, obrigatorio: false }),
    status: opcao(b.status || "ativo", "status", ["ativo", "arquivado"]),
    ano: inteiro(b.ano, "ano", { min: 2000, max: 2100 }),
    semestre: opcao(String(b.semestre), "semestre", ["1", "2"]),
    equipe: texto(b.equipe, "equipe", { max: 120, obrigatorio: false }),
    curso: texto(b.curso, "curso", { max: 80, obrigatorio: false }),
    dataRealizacao: dataIso(b.dataRealizacao, "dataRealizacao"),
    orientadorId,
    alunosIds: listaIds(b.alunosIds, "alunosIds"),
  };
}

r.post("/", comInstituicao, exigePermissao("projeto:criar"), async (req, res) => {
  const id = await rpc("salvar_projeto", { p_inst: req.instituicaoId, p_id: null, p_dados: dadosProjeto(req), p_ator: req.usuario.id });
  res.status(201).json({ id });
});

r.put("/:id", comInstituicao, exigePermissao("projeto:editar"), async (req, res) => {
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
