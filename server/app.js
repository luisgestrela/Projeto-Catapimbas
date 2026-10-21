import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { autenticar, carregarPermissoes, contexto } from "./auth.js";
import { config } from "./config.js";
import { montarEstado } from "./estado.js";
import authRotas from "./routes/auth.js";
import avaliacoesRotas from "./routes/avaliacoes.js";
import bancasRotas from "./routes/bancas.js";
import criteriosRotas from "./routes/criterios.js";
import instituicoesRotas from "./routes/instituicoes.js";
import projetosRotas from "./routes/projetos.js";
import relatoriosRotas from "./routes/relatorios.js";
import usuariosRotas from "./routes/usuarios.js";
import { ErroHttp } from "./supabase.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      mediaSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
}));
if (config.origens.length) app.use(cors({ origin: config.origens, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "200kb" }));

app.get("/api/saude", (_req, res) => res.json({ ok: true }));

// Carrega papéis/permissões sob demanda (serverless não tem "boot" único).
let permissoesProntas;
app.use("/api", (_req, _res, next) => {
  permissoesProntas ??= carregarPermissoes();
  permissoesProntas.then(() => next(), (e) => { permissoesProntas = null; next(e); });
});

app.use("/api", (req, _res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  if (req.get("x-csrf") !== "1") return next(new ErroHttp(403, "Requisição não autorizada."));
  next();
});

app.use("/api/auth", authRotas);
app.use("/api/instituicoes", instituicoesRotas);

app.use("/api", autenticar, contexto);

app.get("/api/estado", async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(await montarEstado(req));
});

app.use("/api/projetos", projetosRotas);
app.use("/api/bancas", bancasRotas);
app.use("/api/avaliacoes", avaliacoesRotas);
app.use("/api/relatorios", relatoriosRotas);
app.use(["/api/solicitacoes", "/api/usuarios"], usuariosRotas);
app.use("/api/instrumentos", criteriosRotas);

app.use("/api", (_req, _res, next) => next(new ErroHttp(404, "Rota não encontrada.")));

app.use((err, _req, res, _next) => {
  if (err instanceof ErroHttp) return res.status(err.status).json({ erro: err.message, campos: err.campos });
  if (err?.type === "entity.parse.failed") return res.status(400).json({ erro: "JSON inválido." });
  console.error(err);
  res.status(500).json({ erro: "Erro interno." });
});

export default app;
