// Servidor local/Render. A aplicação Express vive em app.js (a mesma usada pela função serverless da Vercel).
import app from "./app.js";
import { carregarPermissoes } from "./auth.js";
import { config } from "./config.js";

await carregarPermissoes(); // falha logo na subida se o banco/chave estiverem errados
app.listen(config.porta, () => console.log(`API em http://localhost:${config.porta}`));
