import express from "express";
import mqtt from "mqtt";
import "dotenv/config";

const app = express();
app.use(express.json());

// MQTT
const mqttClient = mqtt.connect(process.env.MQTT_HOST, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
});

mqttClient.on("connect", () => {
  console.log("✅ MQTT conectado");
  mqttClient.subscribe("device/esp32-01/ack");
});

mqttClient.on("message", (topic, message) => {
  console.log("📥 ACK recebido:", message.toString());
});

// Endpoint simples
app.post("/send", (req, res) => {
  mqttClient.publish(
    "device/esp32-01/control",
    JSON.stringify({ action: "ping" }),
    { qos: 1 } // importante pro MVP
  );

  res.json({ sent: true });
});

app.listen(3000, () => {
  console.log("🚀 Express rodando na 3000");
});
