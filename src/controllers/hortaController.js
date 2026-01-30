import { mqttService } from "../services/mqttService.js";

export const sendCommand = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      timestamp: Date.now(),
    };

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