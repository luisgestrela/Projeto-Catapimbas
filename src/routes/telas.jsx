import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Button, EmptyState, PageHeader } from "../components";
import * as P from "../pages";
import { api } from "../lib/api";
import { obterAudio } from "../utils/musica";
import { HOME, ROTULO_PAPEL, CRITERIO_DESEMPATE, calcularRanking, periodoBanca, statusBanca, useApp } from "../state/AppContext";

const TAM_PAGINA = 5;
const normaliza = (s) => String(s ?? "").toLowerCase();
const contem = (a, b) => !b || normaliza(a).includes(normaliza(b));

export function SemAcesso({ texto = "Este conteúdo não existe ou não está disponível para o seu perfil." }) {
  const { papel } = useApp();
  return (
    <>
      <PageHeader title="Conteúdo indisponível" />
      <EmptyState title="Não foi possível abrir esta página" description={texto}
        action={<Button href={HOME[papel] || "/"}>Voltar ao início</Button>} />
    </>
  );
}

// ---------- Regras de visibilidade ----------
function projetosVisiveis({ db, usuario, papel, instId }) {
  let lista = db.projetos;
  if (papel !== "superadmin") lista = lista.filter((p) => p.instituicaoId === instId);
  if (papel === "orientador") lista = lista.filter((p) => p.orientadorId === usuario.id);
  if (papel === "aluno") lista = lista.filter((p) => p.alunosIds.includes(usuario.id));
  return lista;
}
function bancasVisiveis(app) {
  const { db, papel, instId } = app;
  if (papel === "aluno") return []; // aluno não tem área de bancas
  const daInst = db.bancas.filter((b) => b.instituicaoId === instId);
  if (papel === "orientador") {
    const meus = projetosVisiveis(app).map((p) => p.id);
    return daInst.filter((b) => b.projetosIds.some((id) => meus.includes(id)));
  }
  return daInst;
}
const nomeUsuario = (db, id) => db.usuarios.find((u) => u.id === id)?.nome ?? "—";
const gerencia = (papel) => papel === "administrador" || papel === "coordenador";
const comPapelNaInst = (db, instId, papel) =>
  db.usuarios.filter((u) => u.vinculos.some((v) => v.instituicaoId === instId && v.papel === papel && v.situacao === "ativo"));
// Pessoas com o papel indicado e a universidade a que cada uma está vinculada. Sem `instId`, devolve as de todas as instituições
// (visão do superadmin na plataforma); uma pessoa vinculada a duas universidades aparece uma vez em cada.
const pessoasComPapel = (db, papel, instId) => db.usuarios.flatMap((u) => u.vinculos
  .filter((v) => v.papel === papel && v.situacao === "ativo" && (!instId || v.instituicaoId === instId))
  .map((v) => ({ id: u.id, nome: u.nome, email: u.email, instituicaoId: v.instituicaoId, instituicao: db.instituicoes.find((i) => i.id === v.instituicaoId)?.nome || "" })))
  .sort((a, b) => a.nome.localeCompare(b.nome));
const nomeInstituicao = (db, id) => db.instituicoes.find((i) => i.id === id)?.nome || "";

// ---------- Páginas públicas ----------
export function Login() {
  const app = useApp();
  const nav = useNavigate();
  const [erro, setErro] = useState("");
  const dica = (
    <details className="field-hint">
      <summary>Contas de demonstração (senha 12345678)</summary>
      <ul>
        <li>super@demo.com — superadministrador</li>
        <li>admin@demo.com — administrador</li>
        <li>coord@demo.com — coordenador</li>
        <li>orientador@demo.com — orientador</li>
        <li>aluno@demo.com — aluno</li>
        <li>avaliador@demo.com — avaliador (e coordenador em outra instituição)</li>
        <li>pendente@demo.com — aguardando aprovação</li>
        <li>recusado@demo.com — solicitação recusada</li>
      </ul>
    </details>
  );
  return <P.LoginPage dica={dica} erro={erro} onSubmit={async ({ email, senha }) => {
    const r = await app.login(email, senha);
    if (r.erro) setErro(r.erro); else nav(r.destino, { replace: true });
  }} />;
}

export function Cadastro() {
  const app = useApp();
  const [estado, setEstado] = useState({ enviado: false, erro: "" });
  const [ativas, setAtivas] = useState([]);
  useEffect(() => { app.instituicoesPublicas().then(setAtivas).catch(() => setEstado((e) => ({ ...e, erro: "Não foi possível carregar as instituições." }))); }, []); // eslint-disable-line
  return <P.SolicitarCadastroPage instituicoes={ativas} enviado={estado.enviado} erro={estado.erro}
    onSubmit={async (dados) => { const r = await app.cadastrar(dados); setEstado(r.erro ? { enviado: false, erro: r.erro } : { enviado: true, erro: "" }); }} />;
}

export function Recuperar() {
  const app = useApp();
  const [enviado, setEnviado] = useState(false);
  return <P.RecuperarSenhaPage enviado={enviado} onSubmit={async (email) => { await app.recuperarSenha(email); setEnviado(true); }} />;
}

export function ContaPendente() {
  const app = useApp();
  const nav = useNavigate();
  if (app.papel) return <Navigate to={HOME[app.papel]} replace />;
  if (app.vinculosAtivos.length > 1) return <Navigate to="/trocar-instituicao" replace />;
  const vs = app.usuario.vinculos;
  const recusado = !vs.some((v) => v.situacao === "pendente") && vs.find((v) => v.situacao === "recusado");
  return <P.ContaPendentePage status={recusado ? "recusado" : "pendente"} justificativa={recusado?.justificativa}
    onSair={async () => { await app.sair(); nav("/login"); }} />;
}

export function NaoEncontrada() {
  const { papel } = useApp();
  return <P.ErroPage codigo={404} voltarHref={papel ? HOME[papel] : "/"} />;
}

// ---------- Superadmin ----------
export function Instituicoes() {
  const app = useApp();
  const nav = useNavigate();
  // Esta lista é a porta de entrada do superadmin: ao voltar para cá ele sai da instituição que estava aberta.
  useEffect(() => { if (app.instId) app.sairDaInstituicao(); }, []); // eslint-disable-line
  return <P.InstituicoesPage instituicoes={app.db.instituicoes} onNova={() => nav("/instituicoes/nova")}
    onEntrar={async (i) => { const destino = await app.escolherInstituicao(i.id); if (destino) nav(destino); }}
    onEditar={(i) => nav(`/instituicoes/${i.id}/editar`)} onAlterarStatus={(i, s) => app.statusInstituicao(i.id, s)} />;
}

function useLista(caminho) {
  const [linhas, setLinhas] = useState(null);
  const [erro, setErro] = useState("");
  const recarregar = useCallback(() => api.get(caminho).then((d) => { setLinhas(d); setErro(""); }).catch((e) => setErro(e.message || "Não foi possível carregar.")), [caminho]);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { linhas, erro, recarregar };
}

// Falha ao carregar uma lista: mostra o motivo real e permite tentar de novo (em vez de "conteúdo indisponível").
function ErroCarregamento({ texto, onTentar }) {
  return (
    <>
      <PageHeader title="Não foi possível carregar esta página" />
      <EmptyState title="Algo deu errado" description={texto} action={<Button onClick={onTentar}>Tentar novamente</Button>} />
    </>
  );
}

export function SolicitacoesPlataforma() {
  const { linhas, erro, recarregar } = useLista("/plataforma/solicitacoes");
  const [aviso, setAviso] = useState(null);
  const agir = async (fn, sucesso) => {
    try { await fn(); setAviso({ tipo: "ok", texto: sucesso }); await recarregar(); } catch (e) { setAviso({ tipo: "erro", texto: e.message }); }
  };
  if (erro && !linhas) return <ErroCarregamento texto={erro} onTentar={recarregar} />;
  if (!linhas) return <p role="status">Carregando…</p>;
  return <P.SolicitacoesPlataformaPage aviso={aviso} solicitacoes={linhas.map((v) => ({ ...v, papelRotulo: ROTULO_PAPEL[v.papel] || v.papel }))}
    onAprovar={(s) => agir(() => api.post(`/plataforma/solicitacoes/${s.id}/aprovar`), `${s.nome} foi aprovado(a) em ${s.instituicao}.`)}
    onRecusar={(s, j) => agir(() => api.post(`/plataforma/solicitacoes/${s.id}/recusar`, { justificativa: j }), `Solicitação de ${s.nome} recusada.`)} />;
}

export function AdministradoresPlataforma() {
  const app = useApp();
  const admins = useLista("/plataforma/administradores");
  const usuarios = useLista("/plataforma/usuarios");
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const recarregarTudo = () => Promise.all([admins.recarregar(), usuarios.recarregar(), app.recarregar()]);
  if (admins.erro && !admins.linhas) return <ErroCarregamento texto={admins.erro} onTentar={admins.recarregar} />;
  if (!admins.linhas) return <p role="status">Carregando…</p>;
  return <P.AdministradoresPlataformaPage administradores={admins.linhas} usuarios={usuarios.linhas || []} instituicoes={app.db.instituicoes} erros={erros} aviso={aviso}
    onAdicionar={async (instituicaoId, corpo) => {
      try {
        await api.post(`/plataforma/instituicoes/${instituicaoId}/administradores`, corpo);
        setErros({});
        setAviso({ tipo: "ok", texto: `Administrador definido em ${app.db.instituicoes.find((i) => i.id === instituicaoId)?.nome || "a instituição"}.` });
        await recarregarTudo();
        return true;
      } catch (e) {
        setErros(e.campos || { email: e.message });
        setAviso({ tipo: "erro", texto: e.message });
        return false;
      }
    }}
    onRevogar={async (a) => {
      if (!window.confirm(`Remover ${a.nome} como administrador de ${a.instituicao}?`)) return;
      try { await api.del(`/plataforma/administradores/${a.id}`); setAviso({ tipo: "ok", texto: `${a.nome} não administra mais ${a.instituicao}.` }); await recarregarTudo(); }
      catch (e) { setAviso({ tipo: "erro", texto: e.message }); }
    }} />;
}

export function InstituicaoForm() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const [erros, setErros] = useState({});
  const atual = id ? app.db.instituicoes.find((i) => i.id === Number(id)) : {};
  if (!atual) return <SemAcesso />;
  return <P.InstituicaoFormPage key={id || "nova"} inicial={atual} erros={erros} onCancelar={() => nav("/instituicoes")}
    onSubmit={async (f) => {
      const r = await app.salvarInstituicao(f, id ? Number(id) : undefined);
      if (r.erros) setErros(r.erros); else nav("/instituicoes");
    }} />;
}

// ---------- Administrador ----------
export function Aprovacoes() {
  const app = useApp();
  const linhas = app.db.usuarios.flatMap((u) => u.vinculos
    .filter((v) => v.instituicaoId === app.instId && (v.situacao === "pendente" || v.situacao === "recusado"))
    .map((v) => ({ id: u.id, nome: u.nome, email: u.email, papel: ROTULO_PAPEL[v.papel], data: v.data, status: v.situacao })));
  linhas.sort((a, b) => (a.status === "pendente" ? 0 : 1) - (b.status === "pendente" ? 0 : 1));
  return <P.AprovacoesPage solicitacoes={linhas} onAprovar={(s) => app.aprovar(s.id)} onRecusar={(s, j) => app.recusar(s.id, j)} />;
}

export function Pessoas() {
  const app = useApp();
  const vinculos = app.db.usuarios.flatMap((u) => u.vinculos
    .filter((v) => v.instituicaoId === app.instId && (v.situacao === "ativo" || v.situacao === "bloqueado"))
    .map((v) => ({ id: u.id, nome: u.nome, email: u.email, papel: v.papel, situacao: v.situacao })));
  const proprio = (v) => v.id === app.usuario.id && window.alert("Você não pode alterar o seu próprio acesso.") === undefined;
  return <P.PessoasPermissoesPage vinculos={vinculos}
    onAlterarPapel={(v, p) => !proprio(v) && app.alterarPapel(v.id, p)}
    onBloquear={(v, b) => !proprio(v) && app.bloquear(v.id, b)}
    onRevogar={(v) => !proprio(v) && window.confirm(`Revogar o acesso de ${v.nome}?`) && app.revogar(v.id)} />;
}

export function Criterios() {
  const app = useApp();
  const instrumentos = app.db.instrumentos.filter((i) => i.instituicaoId === app.instId);
  return <P.CriteriosPage instrumentos={instrumentos} onSalvarCriterio={app.salvarCriterio} onNovoInstrumento={app.novoInstrumento} onEditarInstrumento={app.editarInstrumento} />;
}

const OPERACOES = { aprovacao: "Aprovação de usuário", nota: "Alteração de nota", permissao: "Mudança de permissão", projeto: "Projeto", banca: "Banca", criterio: "Critério", instituicao: "Instituição" };
const TAM_AUDITORIA = 8;
export function Auditoria() {
  const app = useApp();
  const [f, setF] = useState({ ator: "", operacao: "", de: "", ate: "" });
  const [pagina, setPagina] = useState(1);
  const todos = app.db.auditoria
    .filter((r) => r.instituicaoId === app.instId && contem(r.ator, f.ator) && (!f.operacao || r.operacao === f.operacao)
      && (!f.de || r.iso >= f.de) && (!f.ate || r.iso <= f.ate))
    .map((r) => ({ ...r, operacao: OPERACOES[r.operacao] || r.operacao }));
  const total = Math.max(1, Math.ceil(todos.length / TAM_AUDITORIA));
  const atual = Math.min(pagina, total);
  return <P.AuditoriaPage registros={todos.slice((atual - 1) * TAM_AUDITORIA, atual * TAM_AUDITORIA)} pagina={atual} totalPaginas={total}
    onFiltrar={(v) => { setF(v); setPagina(1); }} onPagina={setPagina} />;
}

// ---------- Compartilhadas ----------
export function Dashboard() {
  const app = useApp();
  const [f, setF] = useState({ ano: "", semestre: "" });
  const projetos = projetosVisiveis(app).filter((p) => (!f.ano || p.ano === Number(f.ano)) && (!f.semestre || p.semestre === f.semestre));
  const ids = projetos.map((p) => p.id);
  const bancas = bancasVisiveis(app).filter((b) => !(f.ano || f.semestre) || b.projetosIds.some((id) => ids.includes(id)));
  const avs = app.db.avaliacoes.filter((a) => bancas.some((b) => b.id === a.bancaId));
  const previstas = bancas.filter((b) => statusBanca(b) === "aberta").reduce((s, b) => s + b.projetosIds.length * b.avaliadoresIds.length, 0);
  const abertasAv = avs.filter((a) => bancas.some((b) => b.id === a.bancaId && statusBanca(b) === "aberta")).length;
  const agrupar = (fn) => Object.entries(projetos.reduce((m, p) => ({ ...m, [fn(p)]: (m[fn(p)] || 0) + 1 }), {})).map(([nome, valor]) => ({ nome, valor }));
  return <P.DashboardPage filtros={f} onFiltrar={setF}
    indicadores={{ projetos: projetos.length, bancas: bancas.length, avaliacoesConcluidas: avs.length, avaliacoesPendentes: Math.max(0, previstas - abertasAv) }}
    porPeriodo={agrupar((p) => `${p.ano}/${p.semestre}`).sort((a, b) => a.nome.localeCompare(b.nome))}
    porStatus={agrupar((p) => (p.status === "ativo" ? "Ativo" : "Arquivado"))} />;
}

export function Projetos() {
  const app = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({});
  const [pagina, setPagina] = useState(1);
  const { db, papel } = app;
  const lista = projetosVisiveis(app).filter((p) => {
    const alunos = p.alunosIds.map((id) => nomeUsuario(db, id)).join(" ");
    return contem(p.nome, f.nome) && contem(nomeUsuario(db, p.orientadorId), f.orientador) && contem(p.equipe, f.equipe) && contem(alunos, f.aluno)
      && (!f.ano || p.ano === Number(f.ano)) && (!f.semestre || p.semestre === f.semestre)
      && (!f.instituicaoId || p.instituicaoId === Number(f.instituicaoId));
  }).sort((a, b) => {
    const k = f.ordenarPor || "nome";
    return k === "ano" ? b.ano - a.ano : String(a[k]).localeCompare(String(b[k]));
  });
  const total = Math.max(1, Math.ceil(lista.length / TAM_PAGINA));
  const atual = Math.min(pagina, total);
  const linhas = lista.slice((atual - 1) * TAM_PAGINA, atual * TAM_PAGINA).map((p) => ({ ...p, orientador: nomeUsuario(db, p.orientadorId), instituicao: nomeInstituicao(db, p.instituicaoId) }));
  const somenteMeus = papel === "aluno" || papel === "orientador";
  const exportar = (ids) => {
    const params = new URLSearchParams();
    for (const k of ["nome", "orientador", "equipe", "aluno", "ano", "semestre"]) if (f[k]) params.set(k, f[k]);
    if (ids?.length) params.set("ids", ids.join(","));
    api.baixar(`/relatorios/exportacao/projetos?${params}`, "projetos.xlsx").catch((e) => window.alert(e.message));
  };
  return <P.ProjetosPage projetos={linhas} pagina={atual} totalPaginas={total} onExportar={exportar} totalFiltrado={lista.length}
    instituicoes={papel === "superadmin" ? db.instituicoes : undefined}
    titulo={somenteMeus ? "Meus projetos" : "Projetos"}
    subtitulo={papel === "aluno" ? "Projetos dos quais você é integrante." : papel === "orientador" ? "Projetos vinculados a você como orientador." : "Consulte, filtre e acompanhe os projetos."}
    podeCriar={["superadmin", "administrador", "coordenador"].includes(papel)}
    onFiltrar={(v) => { setF(v); setPagina(1); }} onPagina={setPagina}
    onNovo={() => nav("/projetos/novo")} onAbrir={(p) => nav(`/projetos/${p.id}`)} />;
}

const podeEditarProjeto = (app) => gerencia(app.papel) || app.papel === "superadmin";

export function ProjetoDetalhe() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const p = projetosVisiveis(app).find((x) => x.id === Number(id));
  if (!p) return <SemAcesso />;
  const integrantes = p.alunosIds.map((aid) => app.db.usuarios.find((u) => u.id === aid)).filter(Boolean)
    .map((u) => ({ id: u.id, nome: u.nome, email: u.email, funcao: "Aluno", instituicao: app.papel === "superadmin" ? nomeInstituicao(app.db, p.instituicaoId) : "" }));
  // A participação em bancas aparece para quem acompanha ou organiza (não para o aluno).
  const mostraBancas = app.instId && app.papel !== "aluno";
  const bancas = mostraBancas ? app.db.bancas.filter((b) => b.projetosIds.includes(p.id))
    .map((b) => ({ id: b.id, nome: b.nome, periodo: periodoBanca(b), status: statusBanca(b) })) : undefined;
  return <P.ProjetoDetalhePage projeto={{ ...p, orientador: nomeUsuario(app.db, p.orientadorId), integrantes, bancas, instituicao: app.papel === "superadmin" ? nomeInstituicao(app.db, p.instituicaoId) : "" }}
    podeEditar={podeEditarProjeto(app)} onEditar={() => nav(`/projetos/${p.id}/editar`)} onVoltar={() => nav("/projetos")} />;
}

export function ProjetoForm() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const [erros, setErros] = useState({});
  const existente = id ? projetosVisiveis(app).find((x) => x.id === Number(id)) : null;
  if (!podeEditarProjeto(app) || (id && !existente)) return <SemAcesso />;
  const naPlataforma = app.papel === "superadmin"; // sem instituição escolhida: o superadmin escolhe a universidade no formulário
  const filtroInst = naPlataforma ? undefined : app.instId;
  const orientadores = pessoasComPapel(app.db, "orientador", filtroInst);
  const alunos = pessoasComPapel(app.db, "aluno", filtroInst);
  return <P.ProjetoFormPage key={id || "novo"} inicial={existente || {}} orientadores={orientadores} alunos={alunos} erros={erros}
    instituicoes={naPlataforma ? app.db.instituicoes.filter((i) => i.status === "ativa" || i.id === existente?.instituicaoId) : undefined}
    onCancelar={() => nav(existente ? `/projetos/${existente.id}` : "/projetos")}
    onSubmit={async (f) => {
      if (!f.nome.trim()) return setErros({ nome: "Informe o nome do projeto." });
      if (naPlataforma && !f.instituicaoId) return setErros({ instituicaoId: "Escolha a universidade do projeto." });
      const r = await app.salvarProjeto({ ...f, nome: f.nome.trim(), instituicaoId: naPlataforma ? f.instituicaoId : undefined }, existente?.id);
      if (r.erro) return;
      nav(existente ? `/projetos/${existente.id}` : "/projetos");
    }} />;
}

export function Bancas() {
  const app = useApp();
  const nav = useNavigate();
  const linhas = bancasVisiveis(app).map((b) => ({
    id: b.id, nome: b.nome, periodo: periodoBanca(b), projetos: b.projetosIds.length, avaliadores: b.avaliadoresIds.length, status: statusBanca(b),
  }));
  return <P.BancasPage bancas={linhas} podeCriar={gerencia(app.papel)} onNova={() => nav("/bancas/nova")} onAbrir={(b) => nav(`/bancas/${b.id}`)} />;
}

export function BancaDetalhe() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const b = bancasVisiveis(app).find((x) => x.id === Number(id));
  if (!b) return <SemAcesso />;
  const { db } = app;
  const banca = {
    nome: b.nome, periodo: periodoBanca(b), status: statusBanca(b),
    projetos: b.projetosIds.map((pid) => db.projetos.find((p) => p.id === pid)).filter(Boolean),
    avaliadores: b.avaliadoresIds.map((uid) => ({
      nome: nomeUsuario(db, uid), total: b.projetosIds.length,
      avaliados: db.avaliacoes.filter((a) => a.bancaId === b.id && a.avaliadorId === uid).length,
    })),
    criterios: b.criterios || [],
  };
  return <P.BancaDetalhePage banca={banca} podeEditar={gerencia(app.papel)} onVoltar={() => nav("/bancas")}
    onEditar={() => nav(`/bancas/${b.id}/editar`)} onVerResultados={() => nav(`/bancas/${b.id}/resultados`)} />;
}

export function BancaForm() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const [erros, setErros] = useState({});
  const existente = id ? app.db.bancas.find((b) => b.id === Number(id) && b.instituicaoId === app.instId) : null;
  if (id && !existente) return <SemAcesso />;
  const { db, instId } = app;
  return <P.BancaFormPage key={id || "nova"} inicial={existente || {}} erros={erros}
    projetos={db.projetos.filter((p) => p.instituicaoId === instId && (p.status === "ativo" || existente?.projetosIds.includes(p.id))).map(({ id: i, nome }) => ({ id: i, nome }))}
    avaliadores={comPapelNaInst(db, instId, "avaliador").map(({ id: i, nome }) => ({ id: i, nome }))}
    instrumentos={db.instrumentos.filter((i) => i.instituicaoId === instId)}
    podeCriarInstrumento={app.papel === "administrador"} onIrParaCriterios={() => nav("/criterios")}
    avaliacoesExistentes={existente ? db.avaliacoes.some((a) => a.bancaId === existente.id) : false}
    onCancelar={() => nav(existente ? `/bancas/${existente.id}` : "/bancas")}
    onSubmit={async (f) => {
      if (f.fim < f.inicio) return setErros({ fim: "O fim não pode ser anterior ao início." });
      if (!f.nome.trim()) return setErros({ nome: "Informe o nome da banca." });
      const r = await app.salvarBanca({ ...f, nome: f.nome.trim() }, existente?.id);
      if (r.erro) return;
      nav("/bancas");
    }} />;
}

function exportarExcel(banca) {
  api.baixar(`/bancas/${banca.id}/exportacao`, `resultados-${banca.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`).catch((e) => window.alert(e.message));
}

function dadosResultado(app, id) {
  const b = bancasVisiveis(app).find((x) => x.id === Number(id));
  if (!b) return {};
  const gerente = gerencia(app.papel);
  if (!gerente && b.resultado !== "publicado") return {};
  const ranking = calcularRanking(app.db, b);
  const notas = app.db.avaliacoes.filter((a) => a.bancaId === b.id).flatMap((a) => a.criterios.map((c) => ({
    projeto: app.db.projetos.find((p) => p.id === a.projetoId)?.nome,
    avaliador: gerente ? nomeUsuario(app.db, a.avaliadorId) : `Avaliador ${b.avaliadoresIds.indexOf(a.avaliadorId) + 1}`,
    chave: `${a.id}-${c.id}`, criterio: c.titulo, peso: c.peso, nota: a.notas[c.id], avaliacaoId: a.id, criterioId: c.id,
  })));
  return { b, ranking, notas, gerente };
}

export function Resultados() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const { b, ranking, notas, gerente } = dadosResultado(app, id);
  useEffect(() => { if (b) obterAudio(); }, [b?.id]); // aquece a música para o pódio abrir sem travar
  if (!b) return <SemAcesso texto="O resultado desta banca ainda não foi publicado ou não está disponível para você." />;
  return <P.ResultadosPage banca={b} ranking={ranking} notas={notas} criterioDesempate={CRITERIO_DESEMPATE} podeGerenciar={gerente}
    onExportar={() => exportarExcel(b)}
    onEditarNota={async (n) => {
      const v = window.prompt(`Nova nota para "${n.criterio}" (atual: ${n.nota}):`);
      if (v === null) return;
      const j = window.prompt("Justificativa da alteração (obrigatória, ficará na auditoria):");
      if (!j?.trim()) return window.alert("Justificativa obrigatória. Nada foi alterado.");
      const r = await app.alterarNota(n.avaliacaoId, n.criterioId, Number(v), j.trim());
      if (r.erro) window.alert(r.erro);
    }}
    onPublicar={() => window.confirm("Publicar o resultado? Ele ficará visível para alunos e orientadores.") && app.publicarResultado(b.id)}
    onAbrirPodio={() => {
      // O clique é o gesto do usuário: libera tela cheia e áudio na página do pódio.
      document.documentElement.requestFullscreen?.().catch(() => {});
      nav(`/bancas/${b.id}/podio`, { state: { auto: true } });
    }} />;
}

export function Podio() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const { b, ranking } = dadosResultado(app, id);
  const { state } = useLocation();
  if (!b) return <SemAcesso texto="O resultado desta banca ainda não foi publicado ou não está disponível para você." />;
  const colocados = ranking.filter((r) => r.posicao <= 3).map((r) => ({ id: r.projetoId, posicao: r.posicao, nome: r.projeto, pontuacao: r.pontuacao }));
  return <P.PodioPage key={String(!!state?.auto)} autoPalco={!!state?.auto} banca={b} colocados={colocados} onVoltar={() => nav(`/bancas/${b.id}/resultados`)} />;
}

export function TrocarInstituicao() {
  const app = useApp();
  const nav = useNavigate();
  if (app.ehSuperadmin) return <Navigate to={HOME.superadmin} replace />;
  const vinculos = app.vinculosAtivos.map((v) => ({
    instituicaoId: v.instituicaoId, papel: ROTULO_PAPEL[v.papel],
    instituicao: app.db.instituicoes.find((i) => i.id === v.instituicaoId)?.nome,
  }));
  return <P.TrocarInstituicaoPage vinculos={vinculos} atualId={app.instId}
    onEscolher={async (v) => { const destino = await app.escolherInstituicao(v.instituicaoId); if (destino) nav(destino); }} />;
}

// ---------- Coordenador ----------
const avaliadosNaBanca = (db, b) => db.avaliacoes.filter((a) => a.bancaId === b.id).length;
const previstasNaBanca = (b) => b.projetosIds.length * b.avaliadoresIds.length;

export function PainelCoordenador() {
  const app = useApp();
  const nav = useNavigate();
  const { db } = app;
  const bancas = bancasVisiveis(app);
  const emAndamento = bancas.filter((b) => b.resultado !== "publicado" && statusBanca(b) === "aberta");
  const pendentes = emAndamento.reduce((s, b) => s + Math.max(0, previstasNaBanca(b) - avaliadosNaBanca(db, b)), 0);
  const prontas = bancas.filter((b) => b.resultado !== "publicado" && statusBanca(b) === "encerrada" && avaliadosNaBanca(db, b) > 0);
  const semAvaliadores = bancas.filter((b) => b.resultado !== "publicado" && b.avaliadoresIds.length === 0);
  const atencao = [
    ...semAvaliadores.map((b) => ({ id: b.id, nome: b.nome, motivo: "Sem avaliadores", destino: "/avaliadores" })),
    ...prontas.map((b) => ({ id: b.id, nome: b.nome, motivo: "Pronta para publicar o resultado", tone: "info", destino: `/bancas/${b.id}/resultados` })),
  ];
  return <P.PainelCoordenadorPage nome={app.usuario.nome} instituicao={app.instituicao?.nome}
    indicadores={{ abertas: emAndamento.length, avaliacoesPendentes: pendentes, aguardandoPublicacao: prontas.length, semAvaliadores: semAvaliadores.length }}
    atencao={atencao}
    proximas={emAndamento.map((b) => ({ id: b.id, nome: b.nome, periodo: periodoBanca(b), avaliados: avaliadosNaBanca(db, b), previstas: previstasNaBanca(b) }))}
    onNovaBanca={() => nav("/bancas/nova")} onAbrirBanca={(a) => nav(a.destino || `/bancas/${a.id}`)}
    onAvaliadores={() => nav("/avaliadores")} onResultados={() => nav("/resultados")} />;
}

export function AvaliadoresBancas() {
  const app = useApp();
  const nav = useNavigate();
  const { db, instId } = app;
  const bancas = bancasVisiveis(app).map((b) => ({
    id: b.id, nome: b.nome, periodo: periodoBanca(b), status: statusBanca(b), totalProjetos: b.projetosIds.length, podeDesignar: b.resultado !== "publicado",
    avaliadores: b.avaliadoresIds.map((uid) => ({ id: uid, nome: nomeUsuario(db, uid), avaliados: db.avaliacoes.filter((a) => a.bancaId === b.id && a.avaliadorId === uid).length })),
  }));
  const disponiveis = comPapelNaInst(db, instId, "avaliador").map(({ id, nome }) => ({ id, nome }));
  return <P.AvaliadoresBancasPage bancas={bancas} disponiveis={disponiveis} onCriarBanca={() => nav("/bancas/nova")}
    onSalvar={(bancaId, ids) => app.designarAvaliadores(bancaId, ids)} />;
}

export function ResultadosBancas() {
  const app = useApp();
  const nav = useNavigate();
  const { db } = app;
  const bancas = bancasVisiveis(app).map((b) => {
    const ranking = calcularRanking(db, b);
    const lider = ranking[0];
    return {
      id: b.id, nome: b.nome, periodo: periodoBanca(b), status: statusBanca(b), resultado: b.resultado,
      avaliados: avaliadosNaBanca(db, b), previstas: previstasNaBanca(b),
      lider: lider?.projeto, pontuacao: lider?.pontuacao ?? 0, empate: !!lider?.empatado, nomeArquivo: b.nome,
    };
  });
  return <P.ResultadosBancasPage bancas={bancas} onCriarBanca={() => nav("/bancas/nova")}
    onAbrir={(b) => nav(`/bancas/${b.id}/resultados`)}
    onPodio={(b) => { document.documentElement.requestFullscreen?.().catch(() => {}); nav(`/bancas/${b.id}/podio`, { state: { auto: true } }); }}
    onExportar={(b) => exportarExcel({ id: b.id, nome: b.nome })}
    onPublicar={(b) => window.confirm(`Publicar o resultado de "${b.nome}"? Ele ficará registrado como definitivo.`) && app.publicarResultado(b.id)} />;
}

// ---------- Orientador ----------
export function Acompanhamento() {
  const app = useApp();
  const nav = useNavigate();
  const { db } = app;
  const projetos = projetosVisiveis(app).map((p) => ({
    id: p.id, nome: p.nome, descricao: p.descricao, status: p.status, equipe: p.equipe, periodo: `${p.ano}/${p.semestre}º semestre`,
    integrantes: p.alunosIds.map((aid) => db.usuarios.find((u) => u.id === aid)).filter(Boolean).map((u) => ({ id: u.id, nome: u.nome, email: u.email })),
    bancas: db.bancas.filter((b) => b.projetosIds.includes(p.id)).map((b) => ({ id: b.id, nome: b.nome, periodo: periodoBanca(b), status: statusBanca(b), resultado: b.resultado })),
  }));
  return <P.AcompanhamentoPage nome={app.usuario.nome} instituicao={app.instituicao?.nome} projetos={projetos} onAbrir={(p) => nav(`/projetos/${p.id}`)} />;
}

// ---------- Avaliador ----------
const bancaDoAvaliador = (app, id) =>
  app.db.bancas.find((b) => b.id === Number(id) && b.instituicaoId === app.instId && b.avaliadoresIds.includes(app.usuario.id));

export function InicioAvaliador() {
  const app = useApp();
  const nav = useNavigate();
  const minhas = app.db.bancas.filter((b) => b.instituicaoId === app.instId && b.avaliadoresIds.includes(app.usuario.id)).map((b) => ({
    id: b.id, nome: b.nome, periodo: periodoBanca(b), status: statusBanca(b), fim: b.fim, totalProjetos: b.projetosIds.length,
    avaliados: app.db.avaliacoes.filter((a) => a.bancaId === b.id && a.avaliadorId === app.usuario.id).length,
  }));
  return <P.InicioAvaliadorPage nome={app.usuario.nome} instituicao={app.instituicao?.nome} bancas={minhas}
    onAbrirBanca={(b) => nav(`/minhas-bancas/${b.id}/avaliar`)} onVerBancas={() => nav("/minhas-bancas")} />;
}

export function MinhasBancas() {
  const app = useApp();
  const nav = useNavigate();
  const bancas = app.db.bancas.filter((b) => b.instituicaoId === app.instId && b.avaliadoresIds.includes(app.usuario.id)).map((b) => ({
    id: b.id, nome: b.nome, periodo: periodoBanca(b), status: statusBanca(b), totalProjetos: b.projetosIds.length,
    avaliados: app.db.avaliacoes.filter((a) => a.bancaId === b.id && a.avaliadorId === app.usuario.id).length,
  }));
  return <P.MinhasBancasPage bancas={bancas} onAbrir={(b) => nav(`/minhas-bancas/${b.id}/avaliar`)} />;
}

export function Avaliacao() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const [erro, setErro] = useState("");
  const b = bancaDoAvaliador(app, id);
  if (!b || statusBanca(b) !== "aberta") return <SemAcesso texto="Esta banca não está aberta para você avaliar." />;
  const { db, usuario } = app;
  const jaFeitas = db.avaliacoes.filter((a) => a.bancaId === b.id && a.avaliadorId === usuario.id).map((a) => a.projetoId);
  const projetos = b.projetosIds.map((pid) => db.projetos.find((p) => p.id === pid)).filter(Boolean)
    .map((p) => ({ id: p.id, nome: p.nome, jaAvaliado: jaFeitas.includes(p.id) }));
  const criterios = b.criterios || [];
  return <P.AvaliacaoPage banca={b} projetos={projetos} criterios={criterios} erro={erro}
    onSubmit={async ({ projetoId, notas }) => {
      if (jaFeitas.includes(Number(projetoId))) return setErro("Você já avaliou este projeto nesta banca.");
      const r = await app.enviarAvaliacao(b.id, projetoId, notas);
      if (r.erro) return setErro(r.erro);
      setErro("");
      nav(`/minhas-bancas/${b.id}/recibo/${r.id}`);
    }} />;
}

export function Recibo() {
  const app = useApp();
  const nav = useNavigate();
  const { avaliacaoId } = useParams();
  const a = app.db.avaliacoes.find((x) => x.id === Number(avaliacaoId) && x.avaliadorId === app.usuario.id);
  if (!a) return <SemAcesso />;
  const recibo = {
    protocolo: a.protocolo, data: a.data, avaliador: app.usuario.nome,
    banca: app.db.bancas.find((b) => b.id === a.bancaId)?.nome, projeto: app.db.projetos.find((p) => p.id === a.projetoId)?.nome,
    notas: a.criterios.map((c) => ({ criterio: c.titulo, nota: a.notas[c.id] })),
  };
  return <P.ReciboPage recibo={recibo} onVoltar={() => nav("/minhas-bancas")} />;
}
