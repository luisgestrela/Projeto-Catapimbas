import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

const BASE = process.env.API_URL || "http://localhost:3001/api";

async function chamar(cookie, metodo, caminho, { corpo, instituicao, csrf = true } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (csrf) headers["X-CSRF"] = "1";
  if (corpo) headers["Content-Type"] = "application/json";
  if (instituicao) headers["X-Instituicao-Id"] = String(instituicao);
  const r = await fetch(`${BASE}${caminho}`, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  let dados = null;
  try { dados = await r.json(); } catch { dados = null; }
  return { status: r.status, dados };
}

async function entrar(email, senha = "12345678") {
  const r = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json", "X-CSRF": "1" }, body: JSON.stringify({ email, senha }) });
  assert.equal(r.status, 200, `login de ${email}`);
  return r.headers.get("set-cookie").split(";")[0];
}

describe("isolamento institucional e autorização", () => {
  const ctx = {};

  before(async () => {
    ctx.super = await entrar("super@demo.com");
    ctx.admin = await entrar("admin@demo.com");
    ctx.avaliador = await entrar("avaliador@demo.com");
    ctx.rafael = await entrar("rafael@demo.com");
    ctx.pendente = await entrar("pendente@demo.com");
    const todos = (await chamar(ctx.super, "GET", "/estado")).dados.db;
    ctx.ucsal = todos.instituicoes.find((i) => i.identificador === "ucsal").id;
    ctx.techba = todos.instituicoes.find((i) => i.identificador === "techba").id;
    ctx.projetoTechba = todos.projetos.find((p) => p.instituicaoId === ctx.techba).id;
    ctx.projetoUcsal = todos.projetos.find((p) => p.instituicaoId === ctx.ucsal).id;
  });

  test("requisição sem sessão é recusada", async () => {
    assert.equal((await chamar(null, "GET", "/estado")).status, 401);
  });

  test("mutação sem cabeçalho anti-CSRF é recusada", async () => {
    const r = await chamar(ctx.admin, "POST", "/projetos", { csrf: false, corpo: {}, instituicao: ctx.ucsal });
    assert.equal(r.status, 403);
  });

  test("C1: conta pendente não acessa a instituição", async () => {
    assert.equal((await chamar(ctx.pendente, "GET", "/estado", { instituicao: ctx.ucsal })).status, 403);
    const sem = await chamar(ctx.pendente, "GET", "/estado");
    assert.equal(sem.dados.db.projetos.length, 0);
  });

  test("C2: administrador da UCSAL não usa o contexto de outra instituição", async () => {
    assert.equal((await chamar(ctx.admin, "GET", "/estado", { instituicao: ctx.techba })).status, 403);
  });

  test("C2: alterar projeto de outra instituição trocando o ID não vaza dados", async () => {
    const corpo = { nome: "Invasão", descricao: "", status: "ativo", ano: 2026, semestre: "1", equipe: "x", alunosIds: [] };
    const r = await chamar(ctx.admin, "PUT", `/projetos/${ctx.projetoTechba}`, { corpo, instituicao: ctx.ucsal });
    assert.ok([403, 404].includes(r.status));
    const estado = (await chamar(ctx.admin, "GET", "/estado", { instituicao: ctx.ucsal })).dados.db;
    assert.ok(!estado.projetos.some((p) => p.id === ctx.projetoTechba));
  });

  test("avaliador não cria projetos nem publica resultados", async () => {
    const corpo = { nome: "Novo", descricao: "", status: "ativo", ano: 2026, semestre: "1", equipe: "x", alunosIds: [] };
    assert.equal((await chamar(ctx.rafael, "POST", "/projetos", { corpo, instituicao: ctx.ucsal })).status, 403);
    assert.equal((await chamar(ctx.rafael, "POST", "/bancas/1/publicar", { instituicao: ctx.ucsal })).status, 403);
  });

  test("C4: segunda avaliação do mesmo projeto pelo mesmo avaliador é rejeitada", async () => {
    const estado = (await chamar(ctx.rafael, "GET", "/estado", { instituicao: ctx.ucsal })).dados.db;
    const banca = estado.bancas.find((b) => b.resultado === "rascunho");
    const feita = estado.avaliacoes.find((a) => a.bancaId === banca.id);
    const notas = Object.fromEntries(banca.criterios.map((c) => [c.id, 3]));
    const r = await chamar(ctx.rafael, "POST", `/bancas/${banca.id}/avaliacoes`, { corpo: { projetoId: feita.projetoId, notas }, instituicao: ctx.ucsal });
    assert.equal(r.status, 409);
  });

  test("avaliador não designado não lança nota", async () => {
    const estado = (await chamar(ctx.admin, "GET", "/estado", { instituicao: ctx.ucsal })).dados.db;
    const banca = estado.bancas.find((b) => b.resultado === "rascunho");
    const notas = Object.fromEntries(banca.criterios.map((c) => [c.id, 3]));
    const r = await chamar(ctx.admin, "POST", `/bancas/${banca.id}/avaliacoes`, { corpo: { projetoId: banca.projetosIds[0], notas }, instituicao: ctx.ucsal });
    assert.equal(r.status, 403);
  });

  test("nota fora da escala é rejeitada", async () => {
    const estado = (await chamar(ctx.avaliador, "GET", "/estado", { instituicao: ctx.ucsal })).dados.db;
    const banca = estado.bancas.find((b) => b.resultado === "rascunho");
    const feitas = estado.avaliacoes.filter((a) => a.bancaId === banca.id).map((a) => a.projetoId);
    const livre = banca.projetosIds.find((id) => !feitas.includes(id));
    const notas = Object.fromEntries(banca.criterios.map((c) => [c.id, 9]));
    const r = await chamar(ctx.avaliador, "POST", `/bancas/${banca.id}/avaliacoes`, { corpo: { projetoId: livre, notas }, instituicao: ctx.ucsal });
    assert.equal(r.status, 400);
  });
  test("superadmin tem as permissões de administrador em qualquer instituição (auditoria visível)", async () => {
    for (const inst of [ctx.ucsal, ctx.techba]) {
      const r = await chamar(ctx.super, "GET", "/estado", { instituicao: inst });
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.dados.db.auditoria));
    }
  });

  test("superadmin sem instituição selecionada não aprova solicitações", async () => {
    assert.equal((await chamar(ctx.super, "POST", "/solicitacoes/1/aprovar")).status, 403);
  });
});
