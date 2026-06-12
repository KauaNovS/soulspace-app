// src/controllers/exerciciosController.js
const pool = require('../db');

// GET /api/exercicios
async function listar(_req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM Exercicio_Fisico ORDER BY id_exercicio');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// POST /api/exercicios
async function criar(req, res) {
  const { titulo, categoria, duracao, descricao, grupo_muscular, nivel_dificuldade, video_url } = req.body;
  if (!titulo) return res.status(400).json({ erro: 'titulo é obrigatório.' });

  try {
    const [result] = await pool.query(
      `INSERT INTO Exercicio_Fisico (titulo, categoria, duracao, descricao, grupo_muscular, nivel_dificuldade, video_url)
       VALUES (?,?,?,?,?,?,?)`,
      [titulo, categoria, duracao, descricao, grupo_muscular, nivel_dificuldade, video_url]
    );
    res.status(201).json({ id_exercicio: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// PUT /api/exercicios/:id
async function atualizar(req, res) {
  const { id } = req.params;
  const { titulo, categoria, duracao, descricao, grupo_muscular, nivel_dificuldade, video_url } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE Exercicio_Fisico SET titulo=?, categoria=?, duracao=?, descricao=?, grupo_muscular=?, nivel_dificuldade=?, video_url=?
       WHERE id_exercicio=?`,
      [titulo, categoria, duracao, descricao, grupo_muscular, nivel_dificuldade, video_url, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Exercício não encontrado.' });
    res.json({ mensagem: 'Exercício atualizado.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// DELETE /api/exercicios/:id
async function remover(req, res) {
  try {
    const [result] = await pool.query('DELETE FROM Exercicio_Fisico WHERE id_exercicio=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Exercício não encontrado.' });
    res.json({ mensagem: 'Exercício removido.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// POST /api/exercicios/:id/toggle
async function toggleProgresso(req, res) {
  const { id } = req.params;
  const userId = req.usuario.user_id;
  try {
    const [existing] = await pool.query(
      'SELECT * FROM Progresso_Exercicio WHERE user_id=? AND id_exercicio=?', [userId, id]
    );
    if (existing.length > 0) {
      await pool.query('DELETE FROM Progresso_Exercicio WHERE user_id=? AND id_exercicio=?', [userId, id]);
      return res.json({ concluido: false });
    } else {
      await pool.query('INSERT INTO Progresso_Exercicio (user_id, id_exercicio) VALUES (?,?)', [userId, id]);
      return res.json({ concluido: true });
    }
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

module.exports = { listar, criar, atualizar, remover, toggleProgresso };
