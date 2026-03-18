import { mqttService } from "../services/mqttService.js";
import redisClient from "../config/redis.js";

export const sendCommand = async (req, res) => {
  try {
    const { mode, duration } = req.body;
    let payload;

    if (!mode) {
      return res.status(400).json({ error: "O campo 'mode' é obrigatório." });
    }

    switch (mode) {
      case "execution":
        if (typeof duration !== "number" || duration <= 0) {
          return res.status(400).json({
            error: "Para o modo 'execution', 'duration' deve ser um número positivo."
          });
        }

        payload = { 
          mode, 
          duration, 
          timestamp: Date.now()
        };

        try {
          await redisClient.zAdd("horta:historico", [
            { score: payload.timestamp, value: JSON.stringify(payload) }
          ]);
          await redisClient.expire("horta:historico", 7 * 24 * 60 * 60);
        } catch (redisError) {
          console.error("⚠️ Erro ao salvar no Redis:", redisError.message);
        }
        break;
      case "stop":
        payload = { mode, timestamp: Date.now() };
        break;

      default:
        return res.status(400).json({
          error: "Modo inválido. Use 'execution' ou 'stop'."
        });
    }

    await mqttService.publishCommand(payload);

    return res.json({ sent: true, payload });
  } catch (error) {
    const statusCode = error.message === "MQTT desconectado" ? 503 : 500;
    return res.status(statusCode).json({ 
      error: error.message, 
      sent: false 
    });
  }
};

export const getHistory = async (_req, res) => {
  try {
    // Busca todos os registros do Sorted Set, do mais novo para o mais antigo
    const history = await redisClient.zRange("horta:historico", 0, -1, { REV: true });
    
    // Converte as strings JSON de volta para objetos
    const parsedHistory = history.map(item => JSON.parse(item));
    
    return res.json(parsedHistory);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar histórico." });
  }
};

export const getHealth = (_req, res) => {
  res.json({
    mqtt: mqttService.isConnected,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};