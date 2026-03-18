import "dotenv/config";

export const config = {
  server: {
    port: process.env.PORT || 3000,
    jwtSecret: process.env.JWT_SECRET || "sua_chave_secreta_super_segura",
    adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  },
  mqtt: {
    host: process.env.MQTT_HOST,
    options: {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      reconnectPeriod: 1000,
      clean: true,
    },
    topics: {
      subscribe: "device/esp32-01/ack",
      publish: "device/esp32/control",
    },
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },
};