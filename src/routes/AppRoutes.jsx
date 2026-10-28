import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "../components";
import * as P from "../pages";
import { HOME, MENUS, MENU_VOLTAR_PLATAFORMA, ROTULO_PAPEL, useApp } from "../state/AppContext";
import * as T from "./telas";

// Layout da área logada. Quem não entrou volta ao login; quem entrou sem instituição
// escolhida é levado a escolher (ou aguardar aprovação).
// Aplica a configuração visual (cor principal) da instituição ativa.
const mistura = (hex, alvo, p) => {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return "#" + c.map((v) => Math.round(v + (alvo - v) * p).toString(16).padStart(2, "0")).join("");
};
function useTemaInstituicao(cor) {
  useEffect(() => {
    const raiz = document.documentElement.style;
    const props = ["--primary", "--primary-700", "--primary-50", "--primary-100"];
    if (/^#[0-9a-f]{6}$/i.test(cor || "")) {
      raiz.setProperty("--primary", cor); raiz.setProperty("--primary-700", mistura(cor, 0, .25));
      raiz.setProperty("--primary-50", mistura(cor, 255, .92)); raiz.setProperty("--primary-100", mistura(cor, 255, .84));
    }
    return () => props.forEach((p) => raiz.removeProperty(p));
  }, [cor]);
}

function Shell({ exigeInstituicao = true }) {
  const app = useApp();
  const nav = useNavigate();
  const { pathname } = useLocation();
  useTemaInstituicao(app.instituicao?.corPrimaria);
  if (!app.logado) return <Navigate to="/login" replace state={{ from: pathname }} />;
  if (exigeInstituicao && !app.papel) {
    return <Navigate to={app.vinculosAtivos.length > 1 ? "/trocar-instituicao" : "/conta-pendente"} replace />;
  }
  const papel = app.papel;
  return (
    <AppLayout
      menuItems={!papel ? [] : app.ehSuperadmin && papel === "administrador" ? [...MENUS.administrador, ...MENU_VOLTAR_PLATAFORMA] : MENUS[papel]}
      currentPath={pathname}
      instituicao={app.instituicao?.nome || (papel === "superadmin" ? "Plataforma" : undefined)}
      usuario={{ nome: app.usuario.nome, papel: papel ? ROTULO_PAPEL[app.ehSuperadmin ? "superadmin" : papel] : undefined }}
      onSair={async () => { await app.sair(); nav("/login"); }}
      onTrocarInstituicao={app.ehSuperadmin ? () => nav("/instituicoes") : app.vinculosAtivos.length > 1 ? () => nav("/trocar-instituicao") : undefined}
    >
      <div key={pathname} className="page-enter"><Outlet /></div>
    </AppLayout>
  );
}

// Restringe uma rota a determinados papéis.
function Papeis({ permitidos, children }) {
  const { papel } = useApp();
  return permitidos.includes(papel) ? children : <T.SemAcesso texto="Você não tem permissão para ver esta página." />;
}
const so = (permitidos, el) => <Papeis permitidos={permitidos}>{el}</Papeis>;

// Telas da plataforma: só o superadmin, esteja ou não dentro de uma instituição.
function SoSuperadmin({ children }) {
  const { ehSuperadmin } = useApp();
  return ehSuperadmin ? children : <T.SemAcesso texto="Você não tem permissão para ver esta página." />;
}
const soSuper = (el) => <SoSuperadmin>{el}</SoSuperadmin>;

function Inicio() {
  const { papel } = useApp();
  return papel ? <Navigate to={HOME[papel]} replace /> : <P.LandingPage />;
}
function SoDeslogado({ children }) {
  const { papel } = useApp();
  return papel ? <Navigate to={HOME[papel]} replace /> : children;
}

const GESTAO = ["administrador", "coordenador"];
const INSTITUCIONAL = ["administrador", "coordenador", "orientador", "aluno", "avaliador"];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<SoDeslogado><T.Login /></SoDeslogado>} />
      <Route path="/cadastro" element={<SoDeslogado><T.Cadastro /></SoDeslogado>} />
      <Route path="/recuperar-senha" element={<SoDeslogado><T.Recuperar /></SoDeslogado>} />
      <Route path="/conta-pendente" element={<T.ContaPendente />} />
      <Route path="/acesso-avaliacao/:token" element={<T.AcessoAvaliacao />} />

      <Route element={<Shell exigeInstituicao={false} />}>
        <Route path="/trocar-instituicao" element={<T.TrocarInstituicao />} />
      </Route>

      <Route element={<Shell />}>
        <Route path="/instituicoes" element={soSuper(<T.Instituicoes />)} />
        <Route path="/instituicoes/nova" element={soSuper(<T.InstituicaoForm />)} />
        <Route path="/instituicoes/:id/editar" element={soSuper(<T.InstituicaoForm />)} />

        <Route path="/dashboard" element={so(["administrador"], <T.Dashboard />)} />

        {/* Projetos: gestão vê todos; orientador e aluno só os vinculados a eles. */}
        <Route path="/projetos" element={so(["superadmin", ...INSTITUCIONAL], <T.Projetos />)} />
        <Route path="/projetos/novo" element={so(["superadmin", ...GESTAO], <T.ProjetoForm />)} />
        <Route path="/projetos/:id" element={so(["superadmin", ...INSTITUCIONAL], <T.ProjetoDetalhe />)} />
        <Route path="/projetos/:id/editar" element={so(["superadmin", ...GESTAO], <T.ProjetoForm />)} />

        {/* Coordenador: organiza bancas, designa avaliadores e consulta resultados. O aluno não tem área de bancas. */}
        <Route path="/painel" element={so(["coordenador"], <T.PainelCoordenador />)} />
        <Route path="/avaliadores" element={so(GESTAO, <T.AvaliadoresBancas />)} />
        <Route path="/resultados" element={so(GESTAO, <T.ResultadosBancas />)} />
        <Route path="/bancas" element={so(GESTAO, <T.Bancas />)} />
        <Route path="/bancas/nova" element={so(GESTAO, <T.BancaForm />)} />
        <Route path="/bancas/:id" element={so(GESTAO, <T.BancaDetalhe />)} />
        <Route path="/bancas/:id/editar" element={so(GESTAO, <T.BancaForm />)} />
        <Route path="/bancas/:id/resultados" element={so(GESTAO, <T.Resultados />)} />
        <Route path="/bancas/:id/podio" element={so(GESTAO, <T.Podio />)} />

        {/* Orientador: acompanha os projetos vinculados a ele e seus integrantes. */}
        <Route path="/acompanhamento" element={so(["orientador"], <T.Acompanhamento />)} />

        <Route path="/aprovacoes" element={so(["administrador"], <T.Aprovacoes />)} />
        <Route path="/pessoas" element={so(["administrador"], <T.Pessoas />)} />
        <Route path="/criterios" element={so(["administrador"], <T.Criterios />)} />
        <Route path="/auditoria" element={so(["administrador"], <T.Auditoria />)} />

        <Route path="/inicio" element={so(["avaliador"], <T.InicioAvaliador />)} />
        <Route path="/minhas-bancas" element={so(["avaliador"], <T.MinhasBancas />)} />
        <Route path="/minhas-bancas/:id/avaliar" element={so(["avaliador"], <T.Avaliacao />)} />
        <Route path="/minhas-bancas/:id/recibo/:avaliacaoId" element={so(["avaliador"], <T.Recibo />)} />
      </Route>

      <Route path="*" element={<T.NaoEncontrada />} />
    </Routes>
  );
}
