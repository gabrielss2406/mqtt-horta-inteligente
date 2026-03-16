import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import cors from "cors";

// Limite de Requisições
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: "Muitas requisições vindas deste IP, tente novamente em 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuração do CORS
export const corsOptions = cors({
  origin: [
    "https://personal-api-horta-inteligente.6v8shu.easypanel.host",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Agrupa Middlewares de Segurança
export const applySecurity = (app) => {
  app.use(helmet());
  app.use(limiter);
  app.use(corsOptions);
};