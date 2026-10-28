import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { calcularRanking } from "../../shared/ranking.js";
import { calcularPainel } from "../../src/utils/painel.js";

const criterios = [{ id: 1, titulo: "A", peso: 2 }, { id: 2, titulo: "B", peso: 1 }];
const projetos = [
  { id: 10, nome: "Alfa", curso: "ADS", ano: 2026, semestre: "1", status: "ativo" },
  { id: 11, nome: "Beta", curso: "ADS", ano: 2026, semestre: "1", status: "ativo" },
  { id: 12, nome: "Gama", curso: "Direito", ano: 2026, semestre: "2", status: "ativo" },
  { id: 13, nome: "Delta", curso: "Direito", ano: 2026, semestre: "2", status: "ativo" },
];
const banca = { id: 1, nome: "Feira 2026", fim: "2999-01-01", resultado: "rascunho", projetosIds: [10, 11, 12, 13], inelegiveisIds: [13], avaliadoresIds: [100, 101] };
const av = (id, projetoId, avaliadorId, a, b) => ({ id, bancaId: 1, projetoId, avaliadorId, criterios, notas: { 1: a, 2: b } });
const avaliacoes = [av(1, 10, 100, 5, 4), av(2, 10, 101, 4, 4), av(3, 11, 100, 5, 4), av(4, 11, 101, 4, 4), av(5, 12, 100, 3, 3), av(6, 13, 100, 5, 5)];

const embaralhar = (xs, semente) => xs.map((x, i) => [x, Math.sin(semente * (i + 1))]).sort((a, b) => a[1] - b[1]).map((p) => p[0]);

describe("ranking por média ponderada", () => {
  test("não depende da ordem em que as avaliações foram enviadas", () => {
    const base = calcularRanking({ projetos, avaliacoes }, banca);
    for (let s = 1; s <= 20; s++) {
      assert.deepEqual(calcularRanking({ projetos, avaliacoes: embaralhar(avaliacoes, s) }, banca), base);
    }
  });

  test("calcula a média ponderada e ignora projeto inelegível", () => {
    const r = calcularRanking({ projetos, avaliacoes }, banca);
    assert.deepEqual(r.map((l) => l.projetoId), [10, 11, 12]);
    assert.equal(r.find((l) => l.projetoId === 12).pontuacao, 3);
    assert.equal(r.find((l) => l.projetoId === 10).pontuacao, Number(((14 / 3 + 12 / 3) / 2).toFixed(4)));
  });

  test("empate real é sinalizado e mantém a mesma posição", () => {
    const r = calcularRanking({ projetos, avaliacoes }, banca);
    assert.deepEqual(r.slice(0, 2).map((l) => [l.posicao, l.empatado]), [[1, true], [1, true]]);
    assert.deepEqual([r[2].posicao, r[2].empatado], [3, false]);
  });

  test("o desempate usa a nota do critério de maior peso", () => {
    const extra = [av(1, 10, 100, 5, 1), av(2, 11, 100, 3, 5)];
    const r = calcularRanking({ projetos, avaliacoes: extra }, banca);
    assert.equal(r[0].projetoId, 10);
  });
});

describe("indicadores do dashboard", () => {
  const dados = { projetos, bancas: [banca], avaliacoes };

  test("conta projetos cadastrados, avaliados, concluídas e pendentes", () => {
    const { indicadores } = calcularPainel(dados, {}, "2026-10-27");
    assert.equal(indicadores.projetos, 4);
    assert.equal(indicadores.projetosAvaliados, 3);
    assert.equal(indicadores.avaliacoesConcluidas, 5);
    assert.equal(indicadores.avaliacoesPendentes, 1);
  });

  test("filtra por curso, período e edição", () => {
    assert.equal(calcularPainel(dados, { curso: "ads" }).indicadores.projetos, 2);
    assert.equal(calcularPainel(dados, { ano: "2026", semestre: "2" }).indicadores.projetos, 2);
    assert.equal(calcularPainel(dados, { bancaId: "1", curso: "Direito" }).ranking.map((l) => l.projetoId).join(), "12");
    assert.equal(calcularPainel(dados, { bancaId: "99" }).indicadores.bancas, 0);
  });

  test("bancas encerradas não geram pendências", () => {
    const encerrada = { ...banca, fim: "2020-01-01" };
    assert.equal(calcularPainel({ ...dados, bancas: [encerrada] }, {}, "2026-10-27").indicadores.avaliacoesPendentes, 0);
  });
});
