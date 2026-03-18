import { createClient } from "redis";
import { config } from "./settings.js";

const client = createClient({
  url: config.redis.url,
});

client.on("error", (err) => console.error("❌ Redis Client Error", err));

(async () => {
  try {
    await client.connect();
    console.log("✅ Redis: Conectado");
  } catch (err) {
    console.error("❌ Erro ao conectar ao Redis:", err);
  }
})();

export default client;