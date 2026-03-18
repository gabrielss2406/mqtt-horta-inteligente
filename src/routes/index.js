import express from "express";
import * as hortaController from "../controllers/hortaController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.get("/health", hortaController.getHealth);
router.post("/login", authController.login);
router.post("/send", authController.verifyToken, hortaController.sendCommand);
router.get("/history", authController.verifyToken, hortaController.getHistory);

export default router;