import { Router } from "express";
import { exigeInstituicao, exigePermissao } from "../auth.js";
import { rpc } from "../supabase.js";
import { inteiro, texto } from "../validar.js";

const r = Router();
r.use(exigeInstituicao);

r.patch("/:id/notas/:criterioId", exigePermissao("nota:corrigir"), async (req, res) => {
  const id = await rpc("corrigir_nota", {
    p_inst: req.instituicaoId, p_avaliacao: inteiro(req.params.id, "id"), p_criterio_versao: inteiro(req.params.criterioId, "criterioId"),
    p_nova: inteiro(req.body?.nota, "nota", { min: 0, max: 100 }), p_justificativa: texto(req.body?.justificativa, "justificativa", { min: 3, max: 500 }),
    p_ator: req.usuario.id,
  });
  res.json({ id });
});

export default r;
