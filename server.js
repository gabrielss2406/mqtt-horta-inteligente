import express from "express";
import mqtt from "mqtt";
import "dotenv/config";

const app = express();

// 1. Configura o Express para aceitar JSON
app.use(express.json());

// 2. SERVIR O FRONTEND: Diz ao Express que a pasta 'public' tem arquivos estáticos
app.use(express.static("public"));

// --- Configuração MQTT (Mantive igual) ---
const mqttClient = mqtt.connect(process.env.MQTT_HOST, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000,
  clean: true
});

mqttClient.on("connect", () => {
  console.log("✅ MQTT conectado");
  mqttClient.subscribe("device/esp32-01/ack", { qos: 1 });
});

mqttClient.on("error", (error) => console.error("❌ Erro MQTT:", error));
mqttClient.on("offline", () => console.warn("⚠️ MQTT offline"));
mqttClient.on("message", (topic, message) => {
  console.log(`📥 ACK recebido [${topic}]:`, message.toString());
});

// --- Rotas da API ---

app.post("/send", (req, res) => {
  if (!mqttClient.connected) {
    return res.status(503).json({ error: "MQTT desconectado", sent: false });
  }

  // Pegamos o corpo inteiro do JSON enviado pelo front
  const payload = JSON.stringify({
    ...req.body,
    timestamp: Date.now()
  });

  mqttClient.publish("device/esp32/control", payload, { qos: 1 }, (err) => {
    if (err) {
      console.error("❌ Erro ao publicar:", err);
      return res.status(500).json({ error: err.message, sent: false });
    }
    console.log("📤 Mensagem enviada:", payload);
    res.json({ sent: true, payload: JSON.parse(payload) });
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    mqtt: mqttClient.connected,
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Sistema rodando em http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  console.log("⏹️ Encerrando...");
  mqttClient.end();
  process.exit(0);
});