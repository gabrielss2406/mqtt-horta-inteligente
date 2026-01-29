import express from "express";
import mqtt from "mqtt";
import "dotenv/config";

const app = express();
app.use(express.json());

// MQTT
const mqttClient = mqtt.connect(process.env.MQTT_HOST, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000, // reconecta automaticamente
  clean: true
});

mqttClient.on("connect", () => {
  console.log("✅ MQTT conectado");
  mqttClient.subscribe("device/esp32-01/ack", { qos: 1 });
});

mqttClient.on("error", (error) => {
  console.error("❌ Erro MQTT:", error);
});

mqttClient.on("offline", () => {
  console.warn("⚠️ MQTT offline");
});

mqttClient.on("message", (topic, message) => {
  console.log(`📥 ACK recebido [${topic}]:`, message.toString());
});

// Endpoint com validação
app.post("/send", (req, res) => {
  if (!mqttClient.connected) {
    return res.status(503).json({ 
      error: "MQTT desconectado",
      sent: false 
    });
  }

  const payload = JSON.stringify({ 
    action: req.body.action || "ping",
    timestamp: Date.now()
  });

  mqttClient.publish(
    "device/esp32-01/control",
    payload,
    { qos: 1 },
    (err) => {
      if (err) {
        console.error("❌ Erro ao publicar:", err);
        return res.status(500).json({ error: err.message, sent: false });
      }
      console.log("📤 Mensagem enviada:", payload);
      res.json({ sent: true, payload });
    }
  );
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    mqtt: mqttClient.connected,
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Express rodando na porta ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("⏹️ Encerrando...");
  mqttClient.end();
  process.exit(0);
});