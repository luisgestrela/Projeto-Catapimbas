// Compatibilidade entre as migrações SQL e o backend, SEM precisar de banco, rede ou dependências.
// Lê supabase/migrations/*.sql e confere se tudo que o backend usa existe lá: tabelas, colunas, relacionamentos
// (embeds do PostgREST), funções RPC (nome e parâmetros), erros de negócio, papéis e permissões.
// Limite: é uma análise estática do estilo de código deste projeto. Ela não executa SQL; para isso use `npm test`
// (isolamento.test.js) com a API rodando contra o banco real.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ---------- utilidades de texto ----------
function dividirTopo(texto) {
  const partes = [];
  let prof = 0, atual = "", aspas = null;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) { atual += c; if (c === aspas && texto[i - 1] !== "\\") aspas = null; continue; }
    if (c === '"' || c === "'" || c === "`") { aspas = c; atual += c; continue; }
    if ("([{".includes(c)) prof++;
    if (")]}".includes(c)) prof--;
    if (c === "," && prof === 0) { partes.push(atual); atual = ""; continue; }
    atual += c;
  }
  if (atual.trim()) partes.push(atual);
  return partes.map((p) => p.trim()).filter(Boolean);
}

// `i` aponta para o caractere de abertura; devolve o índice do fechamento correspondente.
function fechamento(texto, i) {
  const abre = texto[i];
  const fecha = { "(": ")", "{": "}", "[": "]" }[abre];
  let prof = 0, aspas = null;
  for (let k = i; k < texto.length; k++) {
    const c = texto[k];
    if (aspas) { if (c === aspas && texto[k - 1] !== "\\") aspas = null; continue; }
    if (c === '"' || c === "'" || c === "`") { aspas = c; continue; }
    if (c === abre) prof++;
    else if (c === fecha && --prof === 0) return k;
  }
  throw new Error(`Delimitador não fechado: ${texto.slice(i, i + 60)}`);
}

const linhaDe = (texto, indice) => texto.slice(0, indice).split("\n").length;

// ---------- modelo do banco, extraído das migrações ----------
const PASTA_MIGRACOES = join(RAIZ, "supabase", "migrations");
const arquivosSql = readdirSync(PASTA_MIGRACOES).filter((f) => f.endsWith(".sql")).sort();
const sqlPorArquivo = arquivosSql.map((f) => ({ arquivo: f, sql: readFileSync(join(PASTA_MIGRACOES, f), "utf8").replace(/--.*$/gm, "") }));
const sql = sqlPorArquivo.map((x) => x.sql).join("\n");

const tabelas = new Map(); // nome -> { colunas: Set, fks: Map(coluna -> Set(tabelas referenciadas)) }
const adicionarFk = (info, coluna, alvo) => {
  if (!info.fks.has(coluna)) info.fks.set(coluna, new Set());
  info.fks.get(coluna).add(alvo);
};
for (const m of sql.matchAll(/create table (\w+) \(([\s\S]*?)\n\);/g)) {
  const info = { colunas: new Set(), fks: new Map() };
  for (const parte of dividirTopo(m[2])) {
    if (/^(constraint|primary key|unique|check|foreign key)\b/i.test(parte)) {
      const fk = parte.match(/foreign key \(([^)]*)\) references (\w+)/i);
      if (fk) for (const col of fk[1].split(",")) adicionarFk(info, col.trim(), fk[2]);
      continue;
    }
    const col = parte.split(/\s+/)[0];
    info.colunas.add(col);
    const ref = parte.match(/\breferences (\w+)/i);
    if (ref) adicionarFk(info, col, ref[1]);
  }
  tabelas.set(m[1], info);
}
for (const m of sql.matchAll(/alter table (\w+) add column (?:if not exists )?(\w+)([^;]*);/gi)) {
  const info = tabelas.get(m[1]);
  if (!info) continue;
  info.colunas.add(m[2]);
  const ref = m[3].match(/\breferences (\w+)/i);
  if (ref) adicionarFk(info, m[2], ref[1]);
}

const funcoes = new Map(); // nome -> Set(parâmetros)
for (const m of sql.matchAll(/create (?:or replace )?function (\w+)\(([^)]*)\)/gi)) {
  funcoes.set(m[1], new Set(dividirTopo(m[2]).map((p) => p.split(/\s+/)[0])));
}

const excecoesSql = new Set([...sql.matchAll(/raise exception '(\w+)'/g)].map((m) => m[1]));
const tuplas = (comando) => {
  const m = sql.match(new RegExp(`insert into ${comando}[^;]*?values([\\s\\S]*?);`));
  return m ? [...m[1].matchAll(/\('([\w:]+)',\s*'([^']*)'/g)].map((t) => [t[1], t[2]]) : [];
};
const papeisSql = new Set(tuplas("papel \\(codigo, nome\\)").map(([c]) => c));
const permissoesSql = new Set(tuplas("permissao \\(codigo, descricao\\)").map(([c]) => c));
const papelPermissaoSql = tuplas("papel_permissao \\(papel_codigo, permissao_codigo\\)");

// ---------- leitura do código do backend ----------
function listarJs(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (nome === "tests" || nome === "node_modules") return [];
    if (statSync(caminho).isDirectory()) return listarJs(caminho);
    return nome.endsWith(".js") ? [caminho] : [];
  });
}
const fontes = listarJs(join(RAIZ, "server")).map((caminho) => ({
  caminho,
  nome: relative(RAIZ, caminho),
  codigo: readFileSync(caminho, "utf8").replace(/^\s*\/\/.*$/gm, ""),
}));

function chavesObjeto(texto, constantes = new Map()) {
  const chaves = [];
  let prof = 0, inicio = -1, aspas = null;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) { if (c === aspas && texto[i - 1] !== "\\") aspas = null; continue; }
    if (c === '"' || c === "'" || c === "`") { aspas = c; continue; }
    if (c === "{") { if (prof === 0) inicio = i; prof++; }
    else if (c === "}" && --prof === 0) {
      for (const entrada of dividirTopo(texto.slice(inicio + 1, i))) {
        const spread = entrada.match(/^\.\.\.(\w+)$/);
        if (spread && constantes.has(spread[1])) { chaves.push(...constantes.get(spread[1])); continue; }
        if (entrada.startsWith("...")) { chaves.push(...chavesObjeto(entrada, constantes)); continue; }
        const m = entrada.match(/^["']?([A-Za-z_]\w*)["']?\s*(?::|$)/);
        if (m) chaves.push(m[1]);
      }
    }
  }
  return chaves;
}

function constantesDoArquivo(codigo) {
  const mapa = new Map();
  for (const m of codigo.matchAll(/const (\w+)\s*=\s*\{/g)) {
    const abre = m.index + m[0].length - 1;
    mapa.set(m[1], chavesObjeto(codigo.slice(abre, fechamento(codigo, abre) + 1)));
  }
  return mapa;
}

// ---------- verificações de uso ----------
function validarSelect(tabela, colunas, onde, erros) {
  const info = tabelas.get(tabela);
  for (const item of dividirTopo(colunas)) {
    if (item === "*") continue;
    const embed = item.match(/^(?:\w+\s*:\s*)?(\w+)\s*\((.*)\)$/s);
    if (embed) {
      const [, nome, sub] = embed;
      const alvos = info.fks.has(nome) ? [...info.fks.get(nome)] : [];
      if (!alvos.length && tabelas.has(nome)) {
        const reverso = info.fks.size && [...info.fks.values()].some((s) => s.has(nome));
        const direto = [...tabelas.get(nome).fks.values()].some((s) => s.has(tabela));
        if (reverso || direto) alvos.push(nome);
      }
      if (!alvos.length) { erros.push(`${onde}: relacionamento "${nome}" não existe a partir de "${tabela}"`); continue; }
      const subColunas = dividirTopo(sub).map((c) => c.replace(/^\w+\s*:\s*/, ""));
      const ok = alvos.some((a) => subColunas.every((c) => c === "*" || tabelas.get(a).colunas.has(c)));
      if (!ok) erros.push(`${onde}: "${nome}(${sub})" usa coluna inexistente em ${alvos.join("/")}`);
      continue;
    }
    const coluna = item.replace(/^\w+\s*:\s*/, "").replace(/::\w+$/, "");
    if (!info.colunas.has(coluna)) erros.push(`${onde}: coluna "${tabela}.${coluna}" não existe`);
  }
}

const exigirColuna = (tabela, coluna, onde, erros) => {
  if (!tabelas.get(tabela).colunas.has(coluna)) erros.push(`${onde}: coluna "${tabela}.${coluna}" não existe`);
};

function consultasSupabase() {
  const erros = [];
  let total = 0;
  for (const { nome, codigo } of fontes) {
    const constantes = constantesDoArquivo(codigo);
    const onde = (i) => `${nome}:${linhaDe(codigo, i)}`;

    // supabase.from("tabela").select(...).eq(...)...
    for (const m of codigo.matchAll(/supabase\s*\.from\(\s*"(\w+)"\s*\)/g)) {
      total++;
      const tabela = m[1];
      if (!tabelas.has(tabela)) { erros.push(`${onde(m.index)}: tabela "${tabela}" não existe`); continue; }
      let i = m.index + m[0].length;
      for (;;) {
        const chamada = codigo.slice(i).match(/^\s*\.(\w+)\s*\(/);
        if (!chamada) break;
        const abre = i + chamada[0].length - 1;
        const fecha = fechamento(codigo, abre);
        const args = codigo.slice(abre + 1, fecha);
        const aqui = onde(abre);
        const metodo = chamada[1];
        if (metodo === "select") {
          const lit = args.match(/^\s*"([^"]*)"/);
          if (lit) validarSelect(tabela, lit[1], aqui, erros);
        } else if (["insert", "update", "upsert"].includes(metodo)) {
          for (const col of new Set(chavesObjeto(args, constantes))) exigirColuna(tabela, col, aqui, erros);
        } else if (["eq", "neq", "is", "in", "gt", "gte", "lt", "lte", "like", "ilike", "order"].includes(metodo)) {
          const lit = args.match(/^\s*"(\w+)"/);
          if (lit) exigirColuna(tabela, lit[1], aqui, erros);
        }
        i = fecha + 1;
      }
    }

    // buscar("tabela", "colunas", filtros, ["coluna", ids])  (estado.js)
    for (const m of codigo.matchAll(/\bbuscar\(\s*"(\w+)"\s*,\s*"([^"]*)"/g)) {
      total++;
      const [, tabela, colunas] = m;
      if (!tabelas.has(tabela)) { erros.push(`${onde(m.index)}: tabela "${tabela}" não existe`); continue; }
      validarSelect(tabela, colunas, onde(m.index), erros);
      const abre = codigo.indexOf("(", m.index);
      const args = dividirTopo(codigo.slice(abre + 1, fechamento(codigo, abre)));
      const filtros = args[2] || "";
      const chaves = filtros.trim().startsWith("{") ? chavesObjeto(filtros, constantes) : constantes.get(filtros.trim()) || [];
      for (const col of chaves) exigirColuna(tabela, col, onde(m.index), erros);
      const dentro = (args[3] || "").match(/^\[\s*"(\w+)"/);
      if (dentro) exigirColuna(tabela, dentro[1], onde(m.index), erros);
    }

    // em("tabela", "colunas", "coluna", ids, extra)  (ranking.js)
    for (const m of codigo.matchAll(/\bem\(\s*"(\w+)"\s*,\s*"([^"]*)"\s*,\s*"(\w+)"/g)) {
      total++;
      const [, tabela, colunas, coluna] = m;
      if (!tabelas.has(tabela)) { erros.push(`${onde(m.index)}: tabela "${tabela}" não existe`); continue; }
      validarSelect(tabela, colunas, onde(m.index), erros);
      exigirColuna(tabela, coluna, onde(m.index), erros);
    }
  }
  return { erros, total };
}

function chamadasRpc() {
  const erros = [];
  let total = 0;
  for (const { nome, codigo } of fontes) {
    for (const m of codigo.matchAll(/\brpc\(\s*"(\w+)"\s*,/g)) {
      total++;
      const onde = `${nome}:${linhaDe(codigo, m.index)}`;
      const abre = codigo.indexOf("(", m.index);
      const args = dividirTopo(codigo.slice(abre + 1, fechamento(codigo, abre)));
      const params = funcoes.get(m[1]);
      if (!params) { erros.push(`${onde}: função RPC "${m[1]}" não existe nas migrações`); continue; }
      const enviados = new Set(chavesObjeto(args[1] || "{}"));
      const faltando = [...params].filter((p) => !enviados.has(p));
      const sobrando = [...enviados].filter((p) => !params.has(p));
      if (faltando.length || sobrando.length) {
        erros.push(`${onde}: ${m[1]}() — parâmetros ausentes [${faltando}] / desconhecidos [${sobrando}]`);
      }
    }
  }
  return { erros, total };
}

// ---------- testes ----------
describe("compatibilidade entre migrações SQL e backend", () => {
  test("o modelo foi lido das migrações (sanidade do próprio teste)", () => {
    assert.ok(arquivosSql.length >= 1, "nenhuma migração encontrada");
    for (const t of ["usuario", "vinculo_institucional", "papel", "papel_permissao", "auditoria", "projeto", "banca"]) {
      assert.ok(tabelas.has(t), `tabela ${t} não foi lida das migrações`);
    }
    assert.ok(funcoes.has("salvar_projeto") && funcoes.has("publicar_resultado"));
  });

  test("tabelas, colunas e relacionamentos usados nas consultas existem", () => {
    const { erros, total } = consultasSupabase();
    assert.ok(total > 40, `só ${total} consultas analisadas; o analisador parou de reconhecer o código`);
    assert.deepEqual(erros, [], `\n${erros.join("\n")}\n`);
  });

  test("chamadas RPC usam funções e parâmetros que existem", () => {
    const { erros, total } = chamadasRpc();
    assert.ok(total >= 6, `só ${total} chamadas RPC analisadas`);
    assert.deepEqual(erros, [], `\n${erros.join("\n")}\n`);
  });

  test("toda exceção de negócio levantada no SQL tem tradução HTTP no backend", () => {
    const supabaseJs = fontes.find((f) => f.nome.endsWith("server/supabase.js")).codigo;
    const traduzidos = new Set([...supabaseJs.matchAll(/^\s+(\w+):\s*\[\d+,/gm)].map((m) => m[1]));
    const semTraducao = [...excecoesSql].filter((e) => !traduzidos.has(e));
    assert.deepEqual(semTraducao, [], `exceções sem tradução em ERROS_NEGOCIO: ${semTraducao}`);
  });

  test("papéis e permissões citados no backend existem nos dados iniciais do SQL", () => {
    const erros = [];
    for (const { nome, codigo } of fontes) {
      for (const m of codigo.matchAll(/exigePermissao\(([^)]*)\)/g)) {
        for (const p of m[1].matchAll(/"([\w:]+)"/g)) if (!permissoesSql.has(p[1])) erros.push(`${nome}: permissão "${p[1]}" não existe`);
      }
      for (const m of codigo.matchAll(/temPermissao\([^,)]+,\s*"([\w:]+)"\)/g)) {
        if (!permissoesSql.has(m[1])) erros.push(`${nome}: permissão "${m[1]}" não existe`);
      }
      for (const m of codigo.matchAll(/export const PAPEIS(?:_SOLICITAVEIS)? = \[([^\]]*)\]/g)) {
        for (const p of m[1].matchAll(/"(\w+)"/g)) if (!papeisSql.has(p[1])) erros.push(`${nome}: papel "${p[1]}" não existe`);
      }
    }
    assert.ok(papeisSql.size >= 5 && permissoesSql.size >= 10, "dados iniciais não foram lidos do SQL");
    assert.deepEqual(erros, [], `\n${erros.join("\n")}\n`);
  });

  test("papel_permissao do SQL só referencia papéis e permissões cadastrados", () => {
    assert.ok(papelPermissaoSql.length > 0);
    const erros = papelPermissaoSql.filter(([p, q]) => !papeisSql.has(p) || !permissoesSql.has(q)).map(([p, q]) => `${p} → ${q}`);
    assert.deepEqual(erros, []);
  });

  test("nenhuma função é criada depois do grant de execução exclusivo do service_role", () => {
    const erros = [];
    for (const { arquivo, sql: s } of sqlPorArquivo) {
      const ultimoGrant = s.toLowerCase().lastIndexOf("grant execute on all functions in schema public to service_role");
      const ultimaFuncao = Math.max(...[...s.matchAll(/create (?:or replace )?function /gi)].map((m) => m.index), -1);
      if (ultimaFuncao >= 0 && ultimoGrant < ultimaFuncao) erros.push(`${arquivo}: função criada sem revogar/conceder execução em seguida`);
    }
    assert.deepEqual(erros, []);
  });
});
