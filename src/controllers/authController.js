import jwt from "jsonwebtoken";
import { config } from "../config/settings.js";

export const login = (req, res) => {
  const { password } = req.body;

  if (password === config.server.adminPassword) {
    const token = jwt.sign({ role: "admin" }, config.server.jwtSecret, {
      expiresIn: "12h",
    });

    return res.json({ auth: true, token });
  }

  return res.status(401).json({ auth: false, error: "Senha incorreta" });
};

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Bearer Token

  if (!token) {
    return res.status(403).json({ auth: false, error: "Token não fornecido" });
  }

  jwt.verify(token, config.server.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ auth: false, error: "Token inválido" });
    }
    req.user = decoded;
    next();
  });
};