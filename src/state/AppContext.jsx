import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CRITERIO_DESEMPATE, calcularRanking } from "../../shared/ranking";
import { api, definirInstituicao, obterInstituicao } from "../lib/api";

export { CRITERIO_DESEMPATE, calcularRanking };

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const hojeISO = () => new Date().toISOString().slice(0, 10);
const CHAVE_INSTITUICAO = "ap-instituicao";

function lerInstituicao() { try { return Number(sessionStorage.getItem(CHAVE_INSTITUICAO)) || null; } catch { return null; } }
function guardarInstituicao(id) { try { if (id) sessionStorage.setItem(CHAVE_INSTITUICAO, String(id)); else sessionStorage.removeItem(CHAVE_INSTITUICAO); } catch { /* sem armazenamento */ } }

export const HOME = {
  superadmin: "/instituicoes", administrador: "/dashboard", coordenador: "/painel", orientador: "/acompanhamento", aluno: "/projetos", avaliador: "/inicio",
};

// Cada perfil tem o seu fluxo:
// - coordenador: organiza bancas, designa avaliadores e consulta resultados;
// - orientador: acompanha os projetos vinculados a ele e seus integrantes;
// - aluno: vê apenas os projetos em que é integrante (sem área de bancas).
export const MENUS = {
  superadmin: [
    { href: "/instituicoes", label: "Instituições" }, { href: "/projetos", label: "Projetos" },
  ],
  administrador: [
    { href: "/dashboard", label: "Dashboard" }, { href: "/projetos", label: "Projetos" }, { href: "/bancas", label: "Bancas" },
    { href: "/aprovacoes", label: "Aprovações" }, { href: "/pessoas", label: "Pessoas e permissões" },
    { href: "/criterios", label: "Critérios" }, { href: "/auditoria", label: "Auditoria" },
  ],
  coordenador: [
    { href: "/painel", label: "Painel" }, { href: "/bancas", label: "Bancas" }, { href: "/avaliadores", label: "Avaliadores" },
    { href: "/resultados", label: "Resultados" }, { href: "/projetos", label: "Projetos" },
  ],
  orientador: [{ href: "/acompanhamento", label: "Acompanhamento" }, { href: "/projetos", label: "Meus projetos" }],
  aluno: [{ href: "/projetos", label: "Meus projetos" }],
  avaliador: [{ href: "/inicio", label: "Início" }, { href: "/minhas-bancas", label: "Minhas bancas" }],
};

// Dentro de uma instituição o superadmin vê o menu do administrador, mais o caminho de volta à plataforma.
export const MENU_VOLTAR_PLATAFORMA = [{ href: "/instituicoes", label: "Voltar à plataforma" }];

export const ROTULO_PAPEL = {
  superadmin: "Superadministrador", administrador: "Administrador", coordenador: "Coordenador",
  orientador: "Orientador", aluno: "Aluno", avaliador: "Avaliador",
};

export const statusBanca = (b) => (b.resultado === "publicado" || hojeISO() > b.fim ? "encerrada" : "aberta");
export const periodoBanca = (b) => `${new Date(b.inicio + "T12:00").toLocaleDateString("pt-BR")} a ${new Date(b.fim + "T12:00").toLocaleDateString("pt-BR")}`;

const VAZIO = { usuario: null, db: { instituicoes: [], usuarios: [], projetos: [], instrumentos: [], bancas: [], avaliacoes: [], auditoria: [] } };

const ativosDe = (dados) => (dados.usuario?.vinculos || []).filter((x) => x.situacao === "ativo" && dados.db.instituicoes.find((i) => i.id === x.instituicaoId)?.status === "ativa");

export function AppProvider({ children }) {
  const [estado, setEstado] = useState(VAZIO);
  const [instituicaoId, setInstituicaoId] = useState(() => { const id = lerInstituicao(); definirInstituicao(id); return id; });
  const [carregando, setCarregando] = useState(true);

  const escolher = useCallback((id) => { definirInstituicao(id); guardarInstituicao(id); setInstituicaoId(id); }, []);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.get("/estado");
      setEstado(dados);
      return dados;
    } catch (e) {
      if (e.status === 401) { escolher(null); setEstado(VAZIO); return VAZIO; }
      if (e.status === 403 && obterInstituicao()) { escolher(null); return carregar(); }
      throw e;
    }
  }, [escolher]);

  useEffect(() => { carregar().catch(() => setEstado(VAZIO)).finally(() => setCarregando(false)); }, [carregar]);

  const { usuario, db } = estado;
  const vinculosAtivos = ativosDe(estado);
  const vinculoAtual = vinculosAtivos.find((x) => x.instituicaoId === instituicaoId) || null;
  const instituicao = db.instituicoes.find((i) => i.id === instituicaoId) || null;
  const ehSuperadmin = !!usuario?.superadmin;
  // Superadmin: sem instituição escolhida está na "plataforma"; dentro de uma instituição age como administrador dela (com todas as permissões no servidor).
  const papel = ehSuperadmin ? (instituicao ? "administrador" : "superadmin") : vinculoAtual?.papel || null;
  const instId = instituicao?.id ?? null;

  const acao = async (fn, { silencioso = false } = {}) => {
    try {
      const resultado = await fn();
      await carregar();
      return { ok: true, resultado };
    } catch (e) {
      if (e.status === 401) { await carregar(); return { erro: e.message }; }
      if (!silencioso) window.alert(e.message);
      return { erro: e.message, campos: e.campos, status: e.status };
    }
  };

  const api_ = {
    db, usuario, papel, ehSuperadmin, instituicao, instId, vinculosAtivos, carregando,
    sessao: { usuarioId: usuario?.id ?? null, instituicaoId },
    logado: !!usuario,
    recarregar: carregar,

    async login(email, senha) {
      try { await api.post("/auth/login", { email, senha }); } catch (e) { return { erro: e.message }; }
      escolher(null);
      const dados = await carregar();
      if (dados.usuario?.superadmin) return { destino: HOME.superadmin };
      const ativos = ativosDe(dados);
      if (ativos.length === 0) return { destino: "/conta-pendente" };
      if (ativos.length === 1) { escolher(ativos[0].instituicaoId); await carregar(); return { destino: HOME[ativos[0].papel] }; }
      return { destino: "/trocar-instituicao" };
    },
    async sair() {
      try { await api.post("/auth/sair"); } catch { /* sessão já encerrada */ }
      escolher(null);
      setEstado(VAZIO);
    },
    async sairDaInstituicao() {
      escolher(null);
      await carregar();
    },
    async escolherInstituicao(id) {
      if (ehSuperadmin) {
        if (!db.instituicoes.some((i) => i.id === id)) return null;
        escolher(id);
        await carregar();
        return HOME.administrador;
      }
      const v = vinculosAtivos.find((x) => x.instituicaoId === id);
      if (!v) return null;
      escolher(id);
      await carregar();
      return HOME[v.papel];
    },
    async cadastrar({ nome, email, senha, instituicaoId: iid, papel: pedido }) {
      try { await api.post("/auth/cadastro", { nome, email, senha, instituicaoId: Number(iid), papel: pedido }); return { ok: true }; } catch (e) { return { erro: e.message }; }
    },
    async recuperarSenha(email) {
      try { await api.post("/auth/recuperar", { email }); } catch { /* resposta neutra */ }
      return { ok: true };
    },
    instituicoesPublicas: () => api.get("/instituicoes/publicas"),

    async entrarPorLinkAvaliacao(token, usuarioId) {
      try {
        const acesso = await api.post(`/acesso-avaliacao/${encodeURIComponent(token)}/entrar`, { usuarioId: Number(usuarioId) });
        escolher(acesso.instituicaoId);
        await carregar();
        return { destino: `/minhas-bancas/${acesso.bancaId}/avaliar?projeto=${acesso.projetoId}` };
      } catch (e) {
        return { erro: e.message };
      }
    },
    consultarLinkAvaliacao: (token) => api.get(`/acesso-avaliacao/${encodeURIComponent(token)}`),

    async salvarInstituicao(dados, id) {
      const r = await acao(() => (id ? api.put(`/instituicoes/${id}`, dados) : api.post("/instituicoes", dados)), { silencioso: true });
      return r.erro ? { erros: r.campos || { nome: r.erro } } : { ok: true };
    },
    statusInstituicao: (id, status) => acao(() => api.patch(`/instituicoes/${id}/status`, { status })),

    aprovar: (userId) => acao(() => api.post(`/solicitacoes/${userId}/aprovar`)),
    recusar: (userId, justificativa) => acao(() => api.post(`/solicitacoes/${userId}/recusar`, { justificativa })),
    alterarPapel: (userId, novo) => acao(() => api.patch(`/usuarios/${userId}/papel`, { papel: novo })),
    bloquear: (userId, bloquear) => acao(() => api.patch(`/usuarios/${userId}/bloqueio`, { bloquear })),
    revogar: (userId) => acao(() => api.del(`/usuarios/${userId}/vinculo`)),
    // Cadastro direto pelo administrador. `dados.papel` é "aluno" ou "avaliador" (o servidor assume avaliador se vier vazio).
    cadastrarPessoa: (dados) => acao(() => api.post("/usuarios", {
      nome: dados.nome, email: dados.email, senha: dados.senha, papel: dados.papel || "avaliador",
    }), { silencioso: true }),
    cadastrarAvaliador: (dados) => api_.cadastrarPessoa({ ...dados, papel: "avaliador" }),
    novoInstrumento: (nome, descricao) => acao(() => api.post("/instrumentos", { nome, descricao }), { silencioso: true }),
    editarInstrumento: (id, nome, descricao) => acao(() => api.put(`/instrumentos/${id}`, { nome, descricao }), { silencioso: true }),
    salvarCriterio: (instrumentoId, criterio) => acao(() => api.post(`/instrumentos/${instrumentoId}/criterios`, {
      id: criterio.id, titulo: criterio.titulo, descricao: criterio.descricao, peso: criterio.peso, escala: criterio.escala, descritores: criterio.descritores,
    })),

    salvarProjeto: (dados, id) => acao(() => {
      const corpo = {
        nome: dados.nome, descricao: dados.descricao, status: dados.status, ano: Number(dados.ano), semestre: String(dados.semestre),
        equipe: dados.equipe, curso: dados.curso, dataRealizacao: dados.dataRealizacao, orientadorId: Number(dados.orientadorId) || null, alunosIds: dados.alunosIds,
        ...(dados.instituicaoId ? { instituicaoId: Number(dados.instituicaoId) } : {}),
      };
      return id ? api.put(`/projetos/${id}`, corpo) : api.post("/projetos", corpo);
    }),
    salvarBanca: (dados, id) => acao(() => {
      const corpo = {
        nome: dados.nome, inicio: dados.inicio, fim: dados.fim, instrumentoId: Number(dados.instrumentoId),
        projetosIds: dados.projetosIds, avaliadoresIds: dados.avaliadoresIds, pesos: dados.pesos,
      };
      return id ? api.put(`/bancas/${id}`, corpo) : api.post("/bancas", corpo);
    }),
    designarAvaliadores: (bancaId, avaliadoresIds) => acao(() => api.put(`/bancas/${bancaId}/avaliadores`, { avaliadoresIds }), { silencioso: true }),
    gerarLinkAvaliacao: (bancaId, projetoId, avaliadorId) => acao(
      () => api.post(`/bancas/${bancaId}/projetos/${projetoId}/acesso`, { avaliadorId }),
      { silencioso: true },
    ),
    publicarResultado: (bancaId) => acao(() => api.post(`/bancas/${bancaId}/publicar`)),

    alterarNota: (avaliacaoId, criterioId, nova, justificativa) =>
      acao(() => api.patch(`/avaliacoes/${avaliacaoId}/notas/${criterioId}`, { nota: nova, justificativa }), { silencioso: true }),
    async enviarAvaliacao(bancaId, projetoId, notas) {
      const r = await acao(() => api.post(`/bancas/${bancaId}/avaliacoes`, { projetoId: Number(projetoId), notas }), { silencioso: true });
      if (r.erro) {
        // 409 = avaliação duplicada (por exemplo, enviada por outro aparelho): atualiza a lista para mostrar o projeto como avaliado.
        if (r.status === 409) await carregar().catch(() => {});
        return { erro: r.erro, duplicada: r.status === 409 };
      }
      return { id: r.resultado.id };
    },
  };

  const valor = useMemo(() => api_, [estado, instituicaoId, carregando]); // eslint-disable-line
  if (carregando) return <p role="status" style={{ padding: "2rem" }}>Carregando…</p>;
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
