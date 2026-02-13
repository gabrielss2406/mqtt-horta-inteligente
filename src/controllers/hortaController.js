import { mqttService } from "../services/mqttService.js";

export const sendCommand = async (req, res) => {
  try {
    const { mode, duration } = req.body;
    let payload;

    if (!mode) {
      return res.status(400).json({ error: "O campo 'mode' é obrigatório." });
    }

    if (mode === "execution") {
      if (typeof duration !== "number" || duration <= 0) {
        return res.status(400).json({ error: "Para o modo 'execution', 'duration' deve ser um número positivo." });
      }
      payload = { mode, duration, timestamp: Date.now() };
    } else if (mode === "stop") {
      payload = { mode, timestamp: Date.now() };
    } else {
      return res.status(400).json({ error: "Modo inválido. Use 'execution' ou 'stop'." });
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

export const getHealth = (req, res) => {
  res.json({
    mqtt: mqttService.isConnected,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
};