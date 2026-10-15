import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, EmptyState, PageHeader } from "../components";
import * as P from "../pages";
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
  const daInst = db.bancas.filter((b) => b.instituicaoId === instId);
  if (papel === "orientador" || papel === "aluno") {
    const meus = projetosVisiveis(app).map((p) => p.id);
    return daInst.filter((b) => b.projetosIds.some((id) => meus.includes(id)));
  }
  return daInst;
}
const nomeUsuario = (db, id) => db.usuarios.find((u) => u.id === id)?.nome ?? "—";
const gerencia = (papel) => papel === "administrador" || papel === "coordenador";
const comPapelNaInst = (db, instId, papel) =>
  db.usuarios.filter((u) => u.vinculos.some((v) => v.instituicaoId === instId && v.papel === papel && v.situacao === "ativo"));

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
  return <P.LoginPage dica={dica} erro={erro} onSubmit={({ email, senha }) => {
    const r = app.login(email, senha);
    if (r.erro) setErro(r.erro); else nav(r.destino, { replace: true });
  }} />;
}

export function Cadastro() {
  const app = useApp();
  const [estado, setEstado] = useState({ enviado: false, erro: "" });
  const ativas = app.db.instituicoes.filter((i) => i.status === "ativa");
  return <P.SolicitarCadastroPage instituicoes={ativas} enviado={estado.enviado} erro={estado.erro}
    onSubmit={(dados) => { const r = app.cadastrar(dados); setEstado(r.erro ? { enviado: false, erro: r.erro } : { enviado: true, erro: "" }); }} />;
}

export function Recuperar() {
  const app = useApp();
  const [enviado, setEnviado] = useState(false);
  return <P.RecuperarSenhaPage enviado={enviado} onSubmit={() => { app.recuperarSenha(); setEnviado(true); }} />;
}

export function ContaPendente() {
  const app = useApp();
  const nav = useNavigate();
  if (app.papel) return <Navigate to={HOME[app.papel]} replace />;
  if (app.vinculosAtivos.length > 1) return <Navigate to="/trocar-instituicao" replace />;
  const vs = app.usuario.vinculos;
  const recusado = !vs.some((v) => v.situacao === "pendente") && vs.find((v) => v.situacao === "recusado");
  return <P.ContaPendentePage status={recusado ? "recusado" : "pendente"} justificativa={recusado?.justificativa}
    onSair={() => { app.sair(); nav("/login"); }} />;
}

export function NaoEncontrada() {
  const { papel } = useApp();
  return <P.ErroPage codigo={404} voltarHref={papel ? HOME[papel] : "/"} />;
}

// ---------- Superadmin ----------
export function Instituicoes() {
  const app = useApp();
  const nav = useNavigate();
  return <P.InstituicoesPage instituicoes={app.db.instituicoes} onNova={() => nav("/instituicoes/nova")}
    onEditar={(i) => nav(`/instituicoes/${i.id}/editar`)} onAlterarStatus={(i, s) => app.statusInstituicao(i.id, s)} />;
}

export function InstituicaoForm() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const [erros, setErros] = useState({});
  const atual = id ? app.db.instituicoes.find((i) => i.id === Number(id)) : {};
  if (!atual) return <SemAcesso />;
  return <P.InstituicaoFormPage key={id || "nova"} inicial={atual} erros={erros} onCancelar={() => nav("/instituicoes")}
    onSubmit={(f) => {
      const r = app.salvarInstituicao(f, id ? Number(id) : undefined);
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
  return <P.CriteriosPage instrumentos={instrumentos} onSalvarCriterio={app.salvarCriterio}
    onNovoInstrumento={() => { const n = window.prompt("Nome do novo instrumento:"); if (n?.trim()) app.novoInstrumento(n.trim()); }} />;
}

const OPERACOES = { aprovacao: "Aprovação de usuário", nota: "Alteração de nota", permissao: "Mudança de permissão" };
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
  const linhas = lista.slice((atual - 1) * TAM_PAGINA, atual * TAM_PAGINA).map((p) => ({ ...p, orientador: nomeUsuario(db, p.orientadorId) }));
  return <P.ProjetosPage projetos={linhas} pagina={atual} totalPaginas={total}
    instituicoes={papel === "superadmin" ? db.instituicoes : undefined}
    podeCriar={["administrador", "coordenador", "orientador"].includes(papel)}
    onFiltrar={(v) => { setF(v); setPagina(1); }} onPagina={setPagina}
    onNovo={() => nav("/projetos/novo")} onAbrir={(p) => nav(`/projetos/${p.id}`)} />;
}

const podeEditarProjeto = (app, p) => gerencia(app.papel) || (app.papel === "orientador" && p.orientadorId === app.usuario.id);

export function ProjetoDetalhe() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const p = projetosVisiveis(app).find((x) => x.id === Number(id));
  if (!p) return <SemAcesso />;
  const integrantes = p.alunosIds.map((aid) => app.db.usuarios.find((u) => u.id === aid)).filter(Boolean)
    .map((u) => ({ id: u.id, nome: u.nome, email: u.email, funcao: "Aluno" }));
  return <P.ProjetoDetalhePage projeto={{ ...p, orientador: nomeUsuario(app.db, p.orientadorId), integrantes }}
    podeEditar={podeEditarProjeto(app, p)} onEditar={() => nav(`/projetos/${p.id}/editar`)} onVoltar={() => nav("/projetos")} />;
}

export function ProjetoForm() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const [erros, setErros] = useState({});
  const existente = id ? projetosVisiveis(app).find((x) => x.id === Number(id)) : null;
  if (id && (!existente || !podeEditarProjeto(app, existente))) return <SemAcesso />;
  const inicial = existente || { orientadorId: app.papel === "orientador" ? app.usuario.id : "" };
  const orientadores = comPapelNaInst(app.db, app.instId, "orientador").map(({ id: i, nome }) => ({ id: i, nome }));
  const alunos = comPapelNaInst(app.db, app.instId, "aluno").map(({ id: i, nome }) => ({ id: i, nome }));
  return <P.ProjetoFormPage key={id || "novo"} inicial={inicial} orientadores={orientadores} alunos={alunos} erros={erros}
    onCancelar={() => nav(existente ? `/projetos/${existente.id}` : "/projetos")}
    onSubmit={(f) => {
      if (!f.nome.trim()) return setErros({ nome: "Informe o nome do projeto." });
      app.salvarProjeto({ ...f, nome: f.nome.trim() }, existente?.id);
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
  const inst = db.instrumentos.find((i) => i.id === b.instrumentoId);
  const banca = {
    nome: b.nome, periodo: periodoBanca(b), status: statusBanca(b),
    projetos: b.projetosIds.map((pid) => db.projetos.find((p) => p.id === pid)).filter(Boolean),
    avaliadores: b.avaliadoresIds.map((uid) => ({
      nome: nomeUsuario(db, uid), total: b.projetosIds.length,
      avaliados: db.avaliacoes.filter((a) => a.bancaId === b.id && a.avaliadorId === uid).length,
    })),
    criterios: inst?.criterios || [],
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
    onCancelar={() => nav(existente ? `/bancas/${existente.id}` : "/bancas")}
    onSubmit={(f) => {
      if (f.fim < f.inicio) return setErros({ fim: "O fim não pode ser anterior ao início." });
      if (!f.nome.trim()) return setErros({ nome: "Informe o nome da banca." });
      app.salvarBanca({ ...f, nome: f.nome.trim() }, existente?.id);
      nav("/bancas");
    }} />;
}

function exportarCsv(banca, ranking, notas) {
  const linha = (xs) => xs.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(";");
  const csv = [
    linha(["Posição", "Projeto", "Pontuação", "Avaliações válidas"]),
    ...ranking.map((r) => linha([`${r.posicao}º`, r.projeto, r.pontuacao.toFixed(2).replace(".", ","), r.avaliacoes])),
    "", linha(["Projeto", "Avaliador", "Critério", "Nota"]),
    ...notas.map((n) => linha([n.projeto, n.avaliador, n.criterio, n.nota])),
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `resultados-${banca.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv` });
  a.click();
  URL.revokeObjectURL(url);
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
    criterio: c.titulo, nota: a.notas[c.id],
  })));
  return { b, ranking, notas, gerente };
}

export function Resultados() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const { b, ranking, notas, gerente } = dadosResultado(app, id);
  if (!b) return <SemAcesso texto="O resultado desta banca ainda não foi publicado ou não está disponível para você." />;
  return <P.ResultadosPage banca={b} ranking={ranking} notas={notas} criterioDesempate={CRITERIO_DESEMPATE} podeGerenciar={gerente}
    onExportar={() => exportarCsv(b, ranking, notas)}
    onPublicar={() => window.confirm("Publicar o resultado? Ele ficará visível para alunos e orientadores.") && app.publicarResultado(b.id)}
    onAbrirPodio={() => nav(`/bancas/${b.id}/podio`)} />;
}

export function Podio() {
  const app = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const { b, ranking } = dadosResultado(app, id);
  if (!b) return <SemAcesso texto="O resultado desta banca ainda não foi publicado ou não está disponível para você." />;
  const colocados = ranking.filter((r) => r.posicao <= 3).map((r) => ({ id: r.projetoId, posicao: r.posicao, nome: r.projeto, pontuacao: r.pontuacao }));
  return <P.PodioPage banca={b} colocados={colocados} onVoltar={() => nav(`/bancas/${b.id}/resultados`)} />;
}

export function TrocarInstituicao() {
  const app = useApp();
  const nav = useNavigate();
  if (app.papel === "superadmin") return <Navigate to={HOME.superadmin} replace />;
  const vinculos = app.vinculosAtivos.map((v) => ({
    instituicaoId: v.instituicaoId, papel: ROTULO_PAPEL[v.papel],
    instituicao: app.db.instituicoes.find((i) => i.id === v.instituicaoId)?.nome,
  }));
  return <P.TrocarInstituicaoPage vinculos={vinculos} atualId={app.instId}
    onEscolher={(v) => { const destino = app.escolherInstituicao(v.instituicaoId); if (destino) nav(destino); }} />;
}

// ---------- Avaliador ----------
const bancaDoAvaliador = (app, id) =>
  app.db.bancas.find((b) => b.id === Number(id) && b.instituicaoId === app.instId && b.avaliadoresIds.includes(app.usuario.id));

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
  const criterios = db.instrumentos.find((i) => i.id === b.instrumentoId)?.criterios || [];
  return <P.AvaliacaoPage banca={b} projetos={projetos} criterios={criterios} erro={erro}
    onSubmit={({ projetoId, notas }) => {
      if (jaFeitas.includes(Number(projetoId))) return setErro("Você já avaliou este projeto nesta banca.");
      const avId = app.enviarAvaliacao(b.id, projetoId, notas);
      nav(`/minhas-bancas/${b.id}/recibo/${avId}`);
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
