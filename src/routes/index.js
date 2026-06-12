// src/routes/index.js
const express = require('express');
const router  = express.Router();

const authCtrl     = require('../controllers/authController');
const medCtrl      = require('../controllers/meditacoesController');
const exCtrl       = require('../controllers/exerciciosController');
const diarioCtrl   = require('../controllers/diarioController');
const contatoCtrl  = require('../controllers/contatoController');
const { autenticar } = require('../middleware/auth');

// ─── Auth ───────────────────────────────────────────────────
router.post('/auth/cadastro', authCtrl.cadastrar);
router.post('/auth/login',    authCtrl.login);
router.get ('/auth/me',       autenticar, authCtrl.me);
router.put ('/auth/me',       autenticar, authCtrl.atualizarPerfil);

// ─── Meditações (catálogo público + progresso autenticado) ──
router.get   ('/meditacoes',          medCtrl.listar);
router.post  ('/meditacoes',          autenticar, medCtrl.criar);
router.put   ('/meditacoes/:id',      autenticar, medCtrl.atualizar);
router.delete('/meditacoes/:id',      autenticar, medCtrl.remover);
router.post  ('/meditacoes/:id/toggle', autenticar, medCtrl.toggleProgresso);

// ─── Exercícios / Treinos ────────────────────────────────────
router.get   ('/exercicios',          exCtrl.listar);
router.post  ('/exercicios',          autenticar, exCtrl.criar);
router.put   ('/exercicios/:id',      autenticar, exCtrl.atualizar);
router.delete('/exercicios/:id',      autenticar, exCtrl.remover);
router.post  ('/exercicios/:id/toggle', autenticar, exCtrl.toggleProgresso);

// ─── Diário pessoal ───────────────────────────────────────────
router.get   ('/diario',     autenticar, diarioCtrl.listar);
router.post  ('/diario',     autenticar, diarioCtrl.criar);
router.delete('/diario/:id', autenticar, diarioCtrl.remover);

// ─── Contato ───────────────────────────────────────────────────
router.post('/contato', contatoCtrl.enviar);

// ─── Health check ─────────────────────────────────────────────
router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
