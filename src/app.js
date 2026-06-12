// src/app.js – Entrada da aplicação SoulSpace API
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

app.listen(PORT, () => {
  console.log(`✅  SoulSpace API rodando em http://localhost:${PORT}/api`);
});

module.exports = app;
