// src/controllers/diarioController.js
const pool = require('../db');

// GET /api/diario – lista anotações do usuário logado
async function listar(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, titulo_anotacao AS text, categHumor_anotacao AS mood, dataHora_anotacao AS date
       FROM Meu_Diario WHERE user_id = ? ORDER BY dataHora_anotacao DESC`,
      [req.usuario.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// POST /api/diario – cria nova anotação
async function criar(req, res) {
  const { text, mood } = req.body;
  if (!text) return res.status(400).json({ erro: 'text é obrigatório.' });

  try {
    const [result] = await pool.query(
      'INSERT INTO Meu_Diario (user_id, titulo_anotacao, categHumor_anotacao) VALUES (?,?,?)',
      [req.usuario.user_id, text, mood || 'Neutro']
    );
    res.status(201).json({ id: result.insertId, text, mood, date: new Date() });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// DELETE /api/diario/:id
async function remover(req, res) {
  try {
    const [result] = await pool.query(
      'DELETE FROM Meu_Diario WHERE id=? AND user_id=?', [req.params.id, req.usuario.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Anotação não encontrada.' });
    res.json({ mensagem: 'Anotação removida.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

module.exports = { listar, criar, remover };
