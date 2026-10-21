import { Router } from "express";
import { gerarXlsx } from "../../src/utils/xlsx.js";
import { temPermissao } from "../auth.js";
import { projetosDoPerfil } from "../estado.js";
import { ErroHttp, consultar, supabase } from "../supabase.js";

const r = Router();
const podeExportar = (req, _res, next) =>
  req.usuario.superadmin || (req.instituicaoId && temPermissao(req.papel, "relatorio:exportar")) ? next() : next(new ErroHttp(403, "Acesso negado."));
const norm = (s) => String(s ?? "").toLowerCase();
const contem = (a, b) => !b || norm(a).includes(norm(b));

r.get("/exportacao/projetos", podeExportar, async (req, res) => {
  const q = req.query;
  const lista = await projetosDoPerfil(req);
  const ids = new Set(lista.flatMap((p) => [p.orientadorId, ...p.alunosIds]).filter(Boolean));
  const pessoas = ids.size ? await consultar(supabase.from("usuario").select("id, nome").in("id", [...ids])) : [];
  const nome = new Map(pessoas.map((u) => [u.id, u.nome]));
  const selecionados = String(q.ids || "").split(",").map(Number).filter(Boolean);
  const filtrados = lista.filter((p) => contem(p.nome, q.nome) && contem(nome.get(p.orientadorId), q.orientador) && contem(p.equipe, q.equipe)
    && contem(p.alunosIds.map((a) => nome.get(a)).join(" "), q.aluno) && (!q.ano || p.ano === Number(q.ano)) && (!q.semestre || p.semestre === String(q.semestre))
    && (!selecionados.length || selecionados.includes(p.id)));
  const insts = await consultar(supabase.from("instituicao").select("id, nome"));
  const nomeInst = new Map(insts.map((i) => [i.id, i.nome]));
  const blob = gerarXlsx([{ nome: "Projetos", linhas: [
    ["Projeto", "Descrição", "Instituição", "Orientador", "Equipe", "Alunos", "Ano", "Semestre", "Situação"],
    ...filtrados.map((p) => [p.nome, p.descricao, nomeInst.get(p.instituicaoId) || "", nome.get(p.orientadorId) || "", p.equipe,
      p.alunosIds.map((a) => nome.get(a)).join(", "), p.ano, `${p.semestre}º`, p.status === "ativo" ? "Ativo" : "Arquivado"]),
  ] }]);
  res.setHeader("Content-Type", blob.type);
  res.setHeader("Content-Disposition", 'attachment; filename="projetos.xlsx"');
  res.send(Buffer.from(await blob.arrayBuffer()));
});

export default r;
