// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../db');
const { SECRET } = require('../middleware/auth');

// POST /api/auth/cadastro
async function cadastrar(req, res) {
  const { Nome, email, senha, cpf, contato } = req.body;
  if (!Nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios.' });
  }

  try {
    const [existing] = await pool.query('SELECT user_id FROM Usuario WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const hash = await bcrypt.hash(senha, 10);
    const [result] = await pool.query(
      'INSERT INTO Usuario (Nome, email, senha, cpf, contato) VALUES (?, ?, ?, ?, ?)',
      [Nome, email, hash, cpf || null, contato || null]
    );

    const token = jwt.sign({ user_id: result.insertId, email, Nome }, SECRET, { expiresIn: '8h' });
    res.status(201).json({
      mensagem: 'Usuário criado com sucesso.',
      token,
      usuario: { user_id: result.insertId, Nome, email, cpf, contato, endereco: '' }
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

  try {
    const [rows] = await pool.query('SELECT * FROM Usuario WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

    const usuario = rows[0];
    const ok = await bcrypt.compare(senha, usuario.senha);
    if (!ok) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

    const token = jwt.sign({ user_id: usuario.user_id, email: usuario.email, Nome: usuario.Nome }, SECRET, { expiresIn: '8h' });
    delete usuario.senha;
    res.json({ token, usuario });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// GET /api/auth/me  – retorna usuário logado + progresso
async function me(req, res) {
  try {
    const userId = req.usuario.user_id;
    const [[usuario]] = await pool.query(
      'SELECT user_id, Nome, email, cpf, contato, endereco FROM Usuario WHERE user_id = ?', [userId]
    );
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

    const [medDone] = await pool.query('SELECT id_meditacao FROM Progresso_Meditacao WHERE user_id = ?', [userId]);
    const [exDone]  = await pool.query('SELECT id_exercicio FROM Progresso_Exercicio WHERE user_id = ?', [userId]);
    const [diario]  = await pool.query(
      'SELECT id, titulo_anotacao AS text, categHumor_anotacao AS mood, dataHora_anotacao AS date FROM Meu_Diario WHERE user_id = ? ORDER BY dataHora_anotacao DESC',
      [userId]
    );

    res.json({
      ...usuario,
      progresso: {
        meditacoesConcluidas: medDone.map(r => r.id_meditacao),
        treinosConcluidos: exDone.map(r => r.id_exercicio),
        diario,
      }
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

// PUT /api/auth/me – atualizar dados do perfil
async function atualizarPerfil(req, res) {
  const { Nome, contato, endereco, email } = req.body;
  try {
    await pool.query(
      'UPDATE Usuario SET Nome=?, contato=?, endereco=?, email=? WHERE user_id=?',
      [Nome, contato, endereco, email, req.usuario.user_id]
    );
    res.json({ mensagem: 'Perfil atualizado.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro interno.', detalhe: err.message });
  }
}

module.exports = { cadastrar, login, me, atualizarPerfil };
