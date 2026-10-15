import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AppLayout } from "../components";
import * as P from "../pages";
import { HOME, MENUS, ROTULO_PAPEL, useApp } from "../state/AppContext";
import * as T from "./telas";

// Layout da área logada. Quem não entrou volta ao login; quem entrou sem instituição
// escolhida é levado a escolher (ou aguardar aprovação).
function Shell({ exigeInstituicao = true }) {
  const app = useApp();
  const nav = useNavigate();
  const { pathname } = useLocation();
  if (!app.logado) return <Navigate to="/login" replace state={{ from: pathname }} />;
  if (exigeInstituicao && !app.papel) {
    return <Navigate to={app.vinculosAtivos.length > 1 ? "/trocar-instituicao" : "/conta-pendente"} replace />;
  }
  const papel = app.papel;
  return (
    <AppLayout
      menuItems={papel ? MENUS[papel] : []}
      currentPath={pathname}
      instituicao={app.instituicao?.nome || (papel === "superadmin" ? "Plataforma" : undefined)}
      usuario={{ nome: app.usuario.nome, papel: papel ? ROTULO_PAPEL[papel] : undefined }}
      onSair={() => { app.sair(); nav("/login"); }}
      onTrocarInstituicao={app.vinculosAtivos.length > 1 ? () => nav("/trocar-instituicao") : undefined}
    >
      <Outlet />
    </AppLayout>
  );
}

// Restringe uma rota a determinados papéis.
function Papeis({ permitidos, children }) {
  const { papel } = useApp();
  return permitidos.includes(papel) ? children : <T.SemAcesso texto="Você não tem permissão para ver esta página." />;
}
const so = (permitidos, el) => <Papeis permitidos={permitidos}>{el}</Papeis>;

function Inicio() {
  const { papel } = useApp();
  return papel ? <Navigate to={HOME[papel]} replace /> : <P.LandingPage />;
}
function SoDeslogado({ children }) {
  const { papel } = useApp();
  return papel ? <Navigate to={HOME[papel]} replace /> : children;
}

const GESTAO = ["administrador", "coordenador"];
const INSTITUCIONAL = ["administrador", "coordenador", "orientador", "aluno"];

export default function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<SoDeslogado><T.Login /></SoDeslogado>} />
      <Route path="/cadastro" element={<SoDeslogado><T.Cadastro /></SoDeslogado>} />
      <Route path="/recuperar-senha" element={<SoDeslogado><T.Recuperar /></SoDeslogado>} />
      <Route path="/conta-pendente" element={<T.ContaPendente />} />

      {/* Logado, ainda sem instituição escolhida */}
      <Route element={<Shell exigeInstituicao={false} />}>
        <Route path="/trocar-instituicao" element={<T.TrocarInstituicao />} />
      </Route>

      {/* Área da plataforma */}
      <Route element={<Shell />}>
        <Route path="/instituicoes" element={so(["superadmin"], <T.Instituicoes />)} />
        <Route path="/instituicoes/nova" element={so(["superadmin"], <T.InstituicaoForm />)} />
        <Route path="/instituicoes/:id/editar" element={so(["superadmin"], <T.InstituicaoForm />)} />

        <Route path="/dashboard" element={so(INSTITUCIONAL, <T.Dashboard />)} />

        <Route path="/projetos" element={so(["superadmin", ...INSTITUCIONAL], <T.Projetos />)} />
        <Route path="/projetos/novo" element={so([...GESTAO, "orientador"], <T.ProjetoForm />)} />
        <Route path="/projetos/:id" element={so(["superadmin", ...INSTITUCIONAL], <T.ProjetoDetalhe />)} />
        <Route path="/projetos/:id/editar" element={so([...GESTAO, "orientador"], <T.ProjetoForm />)} />

        <Route path="/bancas" element={so(INSTITUCIONAL, <T.Bancas />)} />
        <Route path="/bancas/nova" element={so(GESTAO, <T.BancaForm />)} />
        <Route path="/bancas/:id" element={so(INSTITUCIONAL, <T.BancaDetalhe />)} />
        <Route path="/bancas/:id/editar" element={so(GESTAO, <T.BancaForm />)} />
        <Route path="/bancas/:id/resultados" element={so(INSTITUCIONAL, <T.Resultados />)} />
        <Route path="/bancas/:id/podio" element={so(INSTITUCIONAL, <T.Podio />)} />

        <Route path="/aprovacoes" element={so(["administrador"], <T.Aprovacoes />)} />
        <Route path="/pessoas" element={so(["administrador"], <T.Pessoas />)} />
        <Route path="/criterios" element={so(["administrador"], <T.Criterios />)} />
        <Route path="/auditoria" element={so(["administrador"], <T.Auditoria />)} />

        <Route path="/minhas-bancas" element={so(["avaliador"], <T.MinhasBancas />)} />
        <Route path="/minhas-bancas/:id/avaliar" element={so(["avaliador"], <T.Avaliacao />)} />
        <Route path="/minhas-bancas/:id/recibo/:avaliacaoId" element={so(["avaliador"], <T.Recibo />)} />
      </Route>

      <Route path="*" element={<T.NaoEncontrada />} />
    </Routes>
  );
}
