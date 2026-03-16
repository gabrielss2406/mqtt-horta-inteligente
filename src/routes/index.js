import express from "express";
import * as hortaController from "../controllers/hortaController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// Rota de Login
router.post("/login", authController.login);

// Rotas de Monitoramento (Públicas)
router.get("/health", hortaController.getHealth);

// Rotas de Comando (Protegidas)
router.post("/send", authController.verifyToken, hortaController.sendCommand);

export default router;