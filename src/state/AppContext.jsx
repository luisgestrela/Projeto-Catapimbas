import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { seed } from "./seed";

// Estado em memória (com cópia em sessionStorage) que faz o papel de back-end
// enquanto a API não existe. Cada função abaixo corresponde a uma etapa da jornada.

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

let seq = Date.now();
const novoId = () => ++seq;
const agora = () => new Date().toLocaleString("pt-BR");
const hojeISO = () => new Date().toISOString().slice(0, 10);

function ler(chave) { try { return JSON.parse(sessionStorage.getItem(chave)); } catch { return null; } }
function guardar(chave, valor) { try { sessionStorage.setItem(chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ } }

export const HOME = { superadmin: "/instituicoes", administrador: "/dashboard", coordenador: "/dashboard", orientador: "/dashboard", aluno: "/dashboard", avaliador: "/minhas-bancas" };

export const MENUS = {
  superadmin: [{ href: "/instituicoes", label: "Instituições" }, { href: "/projetos", label: "Projetos" }],
  administrador: [
    { href: "/dashboard", label: "Dashboard" }, { href: "/projetos", label: "Projetos" }, { href: "/bancas", label: "Bancas" },
    { href: "/aprovacoes", label: "Aprovações" }, { href: "/pessoas", label: "Pessoas e permissões" },
    { href: "/criterios", label: "Critérios" }, { href: "/auditoria", label: "Auditoria" },
  ],
  coordenador: [{ href: "/dashboard", label: "Dashboard" }, { href: "/projetos", label: "Projetos" }, { href: "/bancas", label: "Bancas" }],
  orientador: [{ href: "/dashboard", label: "Dashboard" }, { href: "/projetos", label: "Projetos" }, { href: "/bancas", label: "Bancas" }],
  aluno: [{ href: "/dashboard", label: "Dashboard" }, { href: "/projetos", label: "Projetos" }, { href: "/bancas", label: "Bancas" }],
  avaliador: [{ href: "/minhas-bancas", label: "Minhas bancas" }],
};

export const ROTULO_PAPEL = {
  superadmin: "Superadministrador", administrador: "Administrador", coordenador: "Coordenador",
  orientador: "Orientador", aluno: "Aluno", avaliador: "Avaliador",
};

export const statusBanca = (b) => (b.resultado === "publicado" || hojeISO() > b.fim ? "encerrada" : "aberta");
export const periodoBanca = (b) => `${new Date(b.inicio + "T12:00").toLocaleDateString("pt-BR")} a ${new Date(b.fim + "T12:00").toLocaleDateString("pt-BR")}`;

const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const ponderada = (a) => {
  const soma = a.criterios.reduce((s, c) => s + c.peso, 0);
  return a.criterios.reduce((s, c) => s + (a.notas[c.id] ?? 0) * c.peso, 0) / soma;
};
export const CRITERIO_DESEMPATE = "maior nota média no critério de maior peso";

// Ranking ponderado. Avaliações usam o instantâneo dos critérios do momento do envio.
export function calcularRanking(db, banca) {
  const linhas = banca.projetosIds.map((pid) => {
    const avs = db.avaliacoes.filter((a) => a.bancaId === banca.id && a.projetoId === pid);
    if (!avs.length) return null;
    const topo = avs.map((a) => a.notas[[...a.criterios].sort((x, y) => y.peso - x.peso)[0].id] ?? 0);
    return {
      projetoId: pid, projeto: db.projetos.find((p) => p.id === pid)?.nome ?? "—",
      pontuacao: media(avs.map(ponderada)), desempate: media(topo), avaliacoes: avs.length,
    };
  }).filter(Boolean);
  const chave = (l) => `${l.pontuacao.toFixed(4)}|${l.desempate.toFixed(4)}`;
  linhas.sort((a, b) => b.pontuacao - a.pontuacao || b.desempate - a.desempate);
  return linhas.map((l, i) => {
    const primeiro = linhas.findIndex((x) => chave(x) === chave(l));
    return { ...l, posicao: primeiro + 1, empatado: linhas.filter((x) => chave(x) === chave(l)).length > 1 };
  });
}

export function AppProvider({ children }) {
  const [db, setDbRaw] = useState(() => ler("ap-db") || seed());
  const [sessao, setSessaoRaw] = useState(() => ler("ap-sessao") || { usuarioId: null, instituicaoId: null });

  const setDb = useCallback((fn) => setDbRaw((prev) => {
    const copia = structuredClone(prev);
    fn(copia);
    guardar("ap-db", copia);
    return copia;
  }), []);
  const setSessao = useCallback((s) => { guardar("ap-sessao", s); setSessaoRaw(s); }, []);

  const usuario = db.usuarios.find((u) => u.id === sessao.usuarioId) || null;
  const instAtiva = (id) => db.instituicoes.find((i) => i.id === id)?.status === "ativa";
  const ativosDe = useCallback((u) => (u?.vinculos || []).filter((x) => x.situacao === "ativo" && instAtiva(x.instituicaoId)), [db]); // eslint-disable-line
  const vinculosAtivos = ativosDe(usuario);
  const vinculoAtual = vinculosAtivos.find((x) => x.instituicaoId === sessao.instituicaoId) || null;
  const papel = usuario?.superadmin ? "superadmin" : vinculoAtual?.papel || null;
  const instituicao = db.instituicoes.find((i) => i.id === sessao.instituicaoId) || null;
  const instId = instituicao?.id ?? null;

  const registrar = (d, operacao, entidade, detalhes) =>
    d.auditoria.unshift({ id: novoId(), instituicaoId: instId, data: agora(), iso: hojeISO(), ator: usuario?.nome, operacao, entidade, detalhes });

  const api = {
    db, usuario, papel, instituicao, instId, vinculosAtivos, sessao,
    logado: !!usuario,

    // ---- Entrada na plataforma
    login(email, senha) {
      const u = db.usuarios.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!u || u.senha !== senha) return { erro: "E-mail ou senha incorretos." };
      const ativos = ativosDe(u);
      if (u.superadmin) { setSessao({ usuarioId: u.id, instituicaoId: null }); return { destino: HOME.superadmin }; }
      if (ativos.length === 0) { setSessao({ usuarioId: u.id, instituicaoId: null }); return { destino: "/conta-pendente" }; }
      if (ativos.length === 1) { setSessao({ usuarioId: u.id, instituicaoId: ativos[0].instituicaoId }); return { destino: HOME[ativos[0].papel] }; }
      setSessao({ usuarioId: u.id, instituicaoId: null });
      return { destino: "/trocar-instituicao" };
    },
    sair() { setSessao({ usuarioId: null, instituicaoId: null }); },
    escolherInstituicao(id) {
      const v = vinculosAtivos.find((x) => x.instituicaoId === id);
      if (!v) return null;
      setSessao({ usuarioId: usuario.id, instituicaoId: id });
      return HOME[v.papel];
    },
    cadastrar({ nome, email, senha, instituicaoId, papel: pedido }) {
      const iid = Number(instituicaoId);
      const existente = db.usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (existente?.vinculos.some((x) => x.instituicaoId === iid && x.situacao !== "recusado")) return { erro: "Este e-mail já tem vínculo com a instituição escolhida." };
      const vinculo = { instituicaoId: iid, papel: pedido, situacao: "pendente", data: new Date().toLocaleDateString("pt-BR") };
      setDb((d) => {
        const u = d.usuarios.find((x) => x.id === existente?.id);
        if (u) u.vinculos = [...u.vinculos.filter((x) => x.instituicaoId !== iid), vinculo];
        else d.usuarios.push({ id: novoId(), nome, email: email.trim(), senha, vinculos: [vinculo] });
      });
      return { ok: true };
    },
    recuperarSenha() { return { ok: true }; },

    // ---- Superadmin
    salvarInstituicao(dados, id) {
      const dup = db.instituicoes.find((i) => i.identificador === dados.identificador.trim() && i.id !== id);
      if (dup) return { erros: { identificador: "Já existe uma instituição com este identificador." } };
      setDb((d) => {
        if (id) Object.assign(d.instituicoes.find((i) => i.id === id), dados);
        else d.instituicoes.push({ id: novoId(), ...dados });
        registrar(d, "instituicao", dados.nome, id ? "Instituição editada" : "Instituição cadastrada");
      });
      return { ok: true };
    },
    statusInstituicao(id, status) { setDb((d) => { const i = d.instituicoes.find((x) => x.id === id); i.status = status; registrar(d, "instituicao", i.nome, `Status alterado para ${status}`); }); },

    // ---- Administrador
    aprovar(userId) {
      setDb((d) => {
        const u = d.usuarios.find((x) => x.id === userId);
        const x = u.vinculos.find((y) => y.instituicaoId === instId);
        x.situacao = "ativo";
        registrar(d, "aprovacao", u.nome, `Aprovado como ${x.papel}`);
      });
    },
    recusar(userId, justificativa) {
      setDb((d) => {
        const u = d.usuarios.find((x) => x.id === userId);
        const x = u.vinculos.find((y) => y.instituicaoId === instId);
        x.situacao = "recusado"; x.justificativa = justificativa;
        registrar(d, "aprovacao", u.nome, `Recusado: ${justificativa}`);
      });
    },
    alterarPapel(userId, novo) {
      setDb((d) => {
        const u = d.usuarios.find((x) => x.id === userId);
        const x = u.vinculos.find((y) => y.instituicaoId === instId);
        registrar(d, "permissao", u.nome, `Papel de ${x.papel} para ${novo}`);
        x.papel = novo;
      });
    },
    bloquear(userId, bloquear) {
      setDb((d) => {
        const u = d.usuarios.find((x) => x.id === userId);
        u.vinculos.find((y) => y.instituicaoId === instId).situacao = bloquear ? "bloqueado" : "ativo";
        registrar(d, "permissao", u.nome, bloquear ? "Acesso bloqueado" : "Acesso desbloqueado");
      });
    },
    revogar(userId) {
      setDb((d) => {
        const u = d.usuarios.find((x) => x.id === userId);
        u.vinculos = u.vinculos.filter((y) => y.instituicaoId !== instId);
        registrar(d, "permissao", u.nome, "Acesso à instituição revogado");
      });
    },
    novoInstrumento(nome) { setDb((d) => { d.instrumentos.push({ id: novoId(), instituicaoId: instId, nome, criterios: [] }); }); },
    // Editar cria nova versão do critério (novo id); avaliações antigas mantêm o instantâneo.
    salvarCriterio(instrumentoId, criterio) {
      setDb((d) => {
        const inst = d.instrumentos.find((i) => i.id === instrumentoId);
        const novo = { ...criterio, id: novoId(), versao: (criterio.versao || 1) + (criterio.id ? 1 : 0) };
        registrar(d, "criterio", criterio.titulo, criterio.id ? `Nova versão do critério (peso ${criterio.peso})` : `Critério criado (peso ${criterio.peso})`);
        inst.criterios = criterio.id ? inst.criterios.map((c) => (c.id === criterio.id ? novo : c)) : [...inst.criterios, novo];
      });
    },

    // ---- Projetos e bancas
    salvarProjeto(dados, id) {
      const p = { ...dados, ano: Number(dados.ano), orientadorId: Number(dados.orientadorId) || null };
      setDb((d) => {
        if (id) Object.assign(d.projetos.find((x) => x.id === id), p);
        else d.projetos.push({ id: novoId(), instituicaoId: instId, ...p });
        registrar(d, "projeto", p.nome, id ? "Projeto editado" : "Projeto cadastrado");
      });
    },
    salvarBanca(dados, id) {
      const b = { ...dados, instrumentoId: Number(dados.instrumentoId) };
      setDb((d) => {
        if (id) Object.assign(d.bancas.find((x) => x.id === id), b);
        else d.bancas.push({ id: novoId(), instituicaoId: instId, resultado: "rascunho", ...b });
        registrar(d, "banca", b.nome, id ? "Banca editada (inclui pesos dos critérios)" : "Banca cadastrada");
      });
    },
    publicarResultado(bancaId) {
      setDb((d) => { const b = d.bancas.find((x) => x.id === bancaId); b.resultado = "publicado"; registrar(d, "banca", b.nome, "Resultado publicado"); });
    },

    // ---- Avaliação
    // Correção de nota por gestor, sempre com justificativa e registro na auditoria.
    alterarNota(avaliacaoId, criterioId, nova, justificativa) {
      if (!["administrador", "coordenador"].includes(papel)) return { erro: "Sem permissão para alterar notas." };
      const av = db.avaliacoes.find((a) => a.id === avaliacaoId);
      const crit = db.instrumentos.flatMap((i) => i.criterios).find((c) => c.id === criterioId);
      const { min = 1, max = 5 } = crit?.escala || {};
      if (!av || !(nova >= min && nova <= max)) return { erro: `A nota deve estar entre ${min} e ${max}.` };
      setDb((d) => {
        const a = d.avaliacoes.find((x) => x.id === avaliacaoId);
        const titulo = a.criterios.find((c) => c.id === criterioId)?.titulo;
        registrar(d, "nota", d.projetos.find((p) => p.id === a.projetoId)?.nome, `${titulo}: ${a.notas[criterioId]} → ${nova} (${a.protocolo}). Justificativa: ${justificativa}`);
        a.notas[criterioId] = nova;
      });
      return { ok: true };
    },
    enviarAvaliacao(bancaId, projetoId, notas) {
      const banca = db.bancas.find((b) => b.id === bancaId);
      const inst = db.instrumentos.find((i) => i.id === banca.instrumentoId);
      if (db.avaliacoes.some((a) => a.bancaId === bancaId && a.projetoId === Number(projetoId) && a.avaliadorId === usuario.id)) return null;
      const id = novoId();
      const pesoDe = (cid, base) => Number(banca.pesos?.[cid]) > 0 ? Number(banca.pesos[cid]) : base;
      const av = {
        id, bancaId, projetoId: Number(projetoId), avaliadorId: usuario.id, data: agora(), notas,
        protocolo: `AV-${new Date().getFullYear()}-${String(id).slice(-6)}`,
        criterios: inst.criterios.map(({ id: cid, titulo, peso }) => ({ id: cid, titulo, peso: pesoDe(cid, peso) })),
      };
      setDb((d) => {
        d.avaliacoes.push(av);
        registrar(d, "nota", d.projetos.find((p) => p.id === av.projetoId)?.nome, `Avaliação enviada (${av.protocolo})`);
      });
      return id;
    },
  };

  return <Ctx.Provider value={useMemo(() => api, [db, sessao])}>{children}</Ctx.Provider>; // eslint-disable-line
}
