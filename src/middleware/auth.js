// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'soulspace_secret_2026';

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ erro: 'Token não fornecido.' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Formato inválido. Use: Bearer <token>' });

  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

module.exports = { autenticar, SECRET };
