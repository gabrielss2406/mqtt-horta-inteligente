import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Muitas requisições vindas deste IP, tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const corsOptions = cors({
  origin: [
    "https://personal-api-horta-inteligente.6v8shu.easypanel.host",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

export const applySecurity = (app) => {
  app.use(helmet()); // Middleware que adiciona headers HTTP de segurança automaticamente para proteger a aplicação contra vulnerabilidades comuns.
  app.use(limiter);
  app.use(corsOptions);
};