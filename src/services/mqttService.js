import mqtt from "mqtt";
import { config } from "../config/settings.js";

class MqttService {
  constructor() {
    this.client = mqtt.connect(config.mqtt.host, config.mqtt.options);
    this.isConnected = false;

    this.initializeEvents();
  }

  initializeEvents() {
    this.client.on("connect", () => {
      this.isConnected = true;
      console.log("✅ MQTT Service: Conectado");
      this.client.subscribe(config.mqtt.topics.subscribe, { qos: 1 });
    });

    this.client.on("error", (err) => {
      console.error("❌ MQTT Service Error:", err.message);
    });

    this.client.on("offline", () => {
      this.isConnected = false;
      console.warn("⚠️ MQTT Service: Offline");
    });

    this.client.on("message", (topic, message) => {
      // Aqui você poderia salvar no banco de dados no futuro
      console.log(`📥 ACK [${topic}]:`, message.toString());
    });
  }

  publishCommand(payload) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(new Error("MQTT desconectado"));
      }

      const message = JSON.stringify(payload);

      this.client.publish(
        config.mqtt.topics.publish,
        message,
        { qos: 1 },
        (err) => {
          if (err) return reject(err);
          console.log("📤 Comando enviado:", message);
          resolve(payload);
        }
      );
    });
  }

  disconnect() {
    this.client.end();
  }
}

// Exporta uma instância única (Singleton)
export const mqttService = new MqttService();