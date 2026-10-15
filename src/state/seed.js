// Dados de demonstração. Todas as contas usam a senha "12345678".
const iso = (dias) => new Date(Date.now() + dias * 864e5).toISOString().slice(0, 10);

const descritores = (t) => ({
  1: `${t}: ausente ou sem evidências.`,
  2: `${t}: insuficiente, com lacunas importantes.`,
  3: `${t}: atende ao básico esperado.`,
  4: `${t}: bem desenvolvido, com poucas lacunas.`,
  5: `${t}: excelente e bem demonstrado.`,
});
const crit = (id, titulo, peso, descricao) => ({ id, titulo, descricao, peso, escala: { min: 1, max: 5 }, descritores: descritores(titulo) });

const CRITERIOS_UCSAL = [
  crit(1, "Problema e oportunidade", 2, "Clareza do problema e tamanho da oportunidade."),
  crit(2, "Solução e inovação", 2, "Diferencial e viabilidade técnica da solução."),
  crit(3, "Mercado e modelo de negócio", 1.5, "Público, receita e canais."),
  crit(4, "Equipe", 1, "Complementaridade e dedicação da equipe."),
  crit(5, "Apresentação (pitch)", 1, "Clareza, tempo e domínio do tema."),
];

const v = (instituicaoId, papel, situacao = "ativo", extra = {}) => ({ instituicaoId, papel, situacao, data: "10/09/2026", ...extra });
const user = (id, nome, email, vinculos, extra = {}) => ({ id, nome, email, senha: "12345678", vinculos, ...extra });

// Notas da banca encerrada: [projetoId, avaliadorId, [n1..n5]]
const NOTAS_ENCERRADA = [
  [4, 6, [5, 4, 4, 5, 4]], [4, 7, [4, 4, 5, 4, 5]], [4, 8, [5, 5, 4, 4, 4]],
  [5, 6, [4, 3, 4, 4, 3]], [5, 7, [3, 4, 3, 4, 4]], [5, 8, [4, 4, 3, 3, 4]],
  [6, 6, [3, 3, 3, 4, 3]], [6, 7, [3, 2, 3, 3, 3]], [6, 8, [2, 3, 3, 3, 4]],
  [7, 6, [2, 2, 3, 2, 3]], [7, 7, [3, 2, 2, 3, 2]], [7, 8, [2, 3, 2, 2, 3]],
];

export function seed() {
  const avaliacoes = NOTAS_ENCERRADA.map(([projetoId, avaliadorId, ns], i) => ({
    id: 100 + i, bancaId: 2, projetoId, avaliadorId, data: "30/06/2026, 18:00:00", protocolo: `AV-2026-${String(100 + i).padStart(5, "0")}`,
    criterios: CRITERIOS_UCSAL.map(({ id, titulo, peso }) => ({ id, titulo, peso })),
    notas: Object.fromEntries(CRITERIOS_UCSAL.map((c, k) => [c.id, ns[k]])),
  }));
  avaliacoes.push({
    id: 200, bancaId: 1, projetoId: 1, avaliadorId: 7, data: new Date().toLocaleString("pt-BR"), protocolo: "AV-2026-00200",
    criterios: CRITERIOS_UCSAL.map(({ id, titulo, peso }) => ({ id, titulo, peso })),
    notas: { 1: 5, 2: 4, 3: 4, 4: 5, 5: 4 },
  });

  return {
    instituicoes: [
      { id: 1, nome: "UCSAL", identificador: "ucsal", status: "ativa", corPrimaria: "#0f5e73", logoUrl: "" },
      { id: 2, nome: "Incubadora Tech Bahia", identificador: "techba", status: "ativa", corPrimaria: "#14703f", logoUrl: "" },
    ],
    usuarios: [
      user(1, "Sofia Ribeiro", "super@demo.com", [], { superadmin: true }),
      user(2, "Ana Administradora", "admin@demo.com", [v(1, "administrador")]),
      user(3, "Carlos Coordenador", "coord@demo.com", [v(1, "coordenador")]),
      user(4, "Profa. Marina Lopes", "orientador@demo.com", [v(1, "orientador")]),
      user(5, "Bruno Aluno", "aluno@demo.com", [v(1, "aluno")]),
      user(6, "Paula Avaliadora", "avaliador@demo.com", [v(1, "avaliador"), v(2, "coordenador")]),
      user(7, "Rafael Dantas", "rafael@demo.com", [v(1, "avaliador")]),
      user(8, "Helena Souza", "helena@demo.com", [v(1, "avaliador")]),
      user(9, "Diego Aluno", "diego@demo.com", [v(1, "aluno")]),
      user(10, "Pedro Pendente", "pendente@demo.com", [v(1, "aluno", "pendente", { data: "14/10/2026" })]),
      user(11, "Carla Mendes", "carla@demo.com", [v(1, "avaliador", "pendente", { data: "13/10/2026" })]),
      user(12, "Rui Recusado", "recusado@demo.com", [v(1, "aluno", "recusado", { justificativa: "E-mail institucional não confere com o cadastro de alunos." })]),
      user(13, "Prof. Henrique Dias", "henrique@demo.com", [v(1, "orientador")]),
    ],
    projetos: [
      { id: 1, instituicaoId: 1, nome: "AcolheMãe", descricao: "Plataforma de acolhimento e acompanhamento de gestantes em situação de vulnerabilidade.", status: "ativo", ano: 2026, semestre: "2", orientadorId: 4, equipe: "Time Acolher", alunosIds: [5, 9] },
      { id: 2, instituicaoId: 1, nome: "InovArt", descricao: "Marketplace para artesãos locais venderem para todo o país.", status: "ativo", ano: 2026, semestre: "2", orientadorId: 4, equipe: "Artesãos Digitais", alunosIds: [9] },
      { id: 3, instituicaoId: 1, nome: "VANMO", descricao: "Aplicativo de mobilidade para transporte alternativo em bairros periféricos.", status: "ativo", ano: 2026, semestre: "2", orientadorId: 4, equipe: "Rota Certa", alunosIds: [5] },
      { id: 4, instituicaoId: 1, nome: "HECO", descricao: "Gestão de resíduos eletrônicos com pontos de coleta parceiros.", status: "ativo", ano: 2026, semestre: "1", orientadorId: 4, equipe: "Eco Tech", alunosIds: [5, 9] },
      { id: 5, instituicaoId: 1, nome: "SalvadorGO!", descricao: "Roteiros turísticos colaborativos por bairro.", status: "ativo", ano: 2026, semestre: "1", orientadorId: 13, equipe: "Turismo Local", alunosIds: [] },
      { id: 6, instituicaoId: 1, nome: "Ecoleta", descricao: "Logística reversa para pequenos comércios.", status: "arquivado", ano: 2026, semestre: "1", orientadorId: 13, equipe: "Verde Cidade", alunosIds: [] },
      { id: 7, instituicaoId: 1, nome: "TeraPet", descricao: "Telemedicina veterinária.", status: "arquivado", ano: 2025, semestre: "2", orientadorId: 13, equipe: "Pet Care", alunosIds: [] },
      { id: 8, instituicaoId: 2, nome: "NovaRota", descricao: "Otimização de entregas de última milha.", status: "ativo", ano: 2026, semestre: "2", orientadorId: 6, equipe: "Rota Nova", alunosIds: [] },
    ],
    instrumentos: [
      { id: 1, instituicaoId: 1, nome: "Instrumento padrão de startups", criterios: CRITERIOS_UCSAL },
      { id: 2, instituicaoId: 2, nome: "Instrumento Incubadora", criterios: [crit(50, "Potencial de mercado", 1, "")] },
    ],
    bancas: [
      { id: 1, instituicaoId: 1, nome: "Banca final 2026.2", inicio: iso(-7), fim: iso(60), instrumentoId: 1, projetosIds: [1, 2, 3], avaliadoresIds: [6, 7, 8], resultado: "rascunho" },
      { id: 2, instituicaoId: 1, nome: "Banca parcial 2026.1", inicio: "2026-05-01", fim: "2026-06-30", instrumentoId: 1, projetosIds: [4, 5, 6, 7], avaliadoresIds: [6, 7, 8], resultado: "publicado" },
    ],
    avaliacoes,
    auditoria: [
      { id: 1, instituicaoId: 1, data: "10/09/2026, 09:00:00", iso: "2026-09-10", ator: "Ana Administradora", operacao: "aprovacao", entidade: "Rafael Dantas", detalhes: "Aprovado como avaliador" },
    ],
  };
}
