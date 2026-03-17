import express from "express";
import { config } from "./src/config/settings.js";
import routes from "./src/routes/index.js";
import { applySecurity } from "./src/middlewares/security.js";
import { mqttService } from "./src/services/mqttService.js";

const app = express();

applySecurity(app);

app.use(express.json());
app.use(express.static("public"));

app.use(routes);

app.listen(config.server.port, () => {
  console.log(`🚀 Server rodando na porta ${config.server.port}`);
});

// Graceful Shutdown
process.on("SIGINT", () => {
  console.log("⏹️  Encerrando sistema...");
  mqttService.disconnect();
  process.exit(0);
});