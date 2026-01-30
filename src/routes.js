import express from "express";
import * as hortaController from "./controllers/hortaController.js";

const router = express.Router();

router.post("/send", hortaController.sendCommand);
router.get("/health", hortaController.getHealth);

export default router;