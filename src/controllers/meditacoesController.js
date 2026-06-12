// src/controllers/meditacoesController.js
const pool = require('../db');

// GET /api/meditacoes
async function listar(_req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM Medite_e_relaxe ORDER BY id_meditacao');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// POST /api/meditacoes
async function criar(req, res) {
  const { titulo, descricao, categoria, duracao, audio_url, imagem_url, locutor, nivel } = req.body;
  if (!titulo) return res.status(400).json({ erro: 'titulo é obrigatório.' });

  try {
    const [result] = await pool.query(
      `INSERT INTO Medite_e_relaxe (titulo, descricao, categoria, duracao, audio_url, imagem_url, locutor, nivel)
       VALUES (?,?,?,?,?,?,?,?)`,
      [titulo, descricao, categoria, duracao, audio_url, imagem_url, locutor, nivel || 'Todos os níveis']
    );
    res.status(201).json({ id_meditacao: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// PUT /api/meditacoes/:id
async function atualizar(req, res) {
  const { id } = req.params;
  const { titulo, descricao, categoria, duracao, audio_url, imagem_url, locutor, nivel } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE Medite_e_relaxe SET titulo=?, descricao=?, categoria=?, duracao=?, audio_url=?, imagem_url=?, locutor=?, nivel=?
       WHERE id_meditacao=?`,
      [titulo, descricao, categoria, duracao, audio_url, imagem_url, locutor, nivel, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Meditação não encontrada.' });
    res.json({ mensagem: 'Meditação atualizada.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// DELETE /api/meditacoes/:id
async function remover(req, res) {
  try {
    const [result] = await pool.query('DELETE FROM Medite_e_relaxe WHERE id_meditacao=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Meditação não encontrada.' });
    res.json({ mensagem: 'Meditação removida.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// POST /api/meditacoes/:id/toggle  – marca/desmarca como concluída para o usuário logado
async function toggleProgresso(req, res) {
  const { id } = req.params;
  const userId = req.usuario.user_id;
  try {
    const [existing] = await pool.query(
      'SELECT * FROM Progresso_Meditacao WHERE user_id=? AND id_meditacao=?', [userId, id]
    );
    if (existing.length > 0) {
      await pool.query('DELETE FROM Progresso_Meditacao WHERE user_id=? AND id_meditacao=?', [userId, id]);
      return res.json({ concluida: false });
    } else {
      await pool.query('INSERT INTO Progresso_Meditacao (user_id, id_meditacao) VALUES (?,?)', [userId, id]);
      return res.json({ concluida: true });
    }
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

module.exports = { listar, criar, atualizar, remover, toggleProgresso };
