import express from "express";
import cors from "cors";
import { config } from "./src/config/settings.js";
import routes from "./src/routes.js";
import { mqttService } from "./src/services/mqttService.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve o Frontend

// Rotas da API
app.use(routes);

// Inicialização
app.listen(config.server.port, () => {
  console.log(`🚀 Server rodando na porta ${config.server.port}`);
});

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("⏹️  Encerrando sistema...");
  mqttService.disconnect();
  process.exit(0);
});