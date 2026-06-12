// src/controllers/contatoController.js
// Endpoint simples para o formulário de contato.
// Em produção, isso enviaria um e-mail ou salvaria em uma tabela "Mensagens".

async function enviar(req, res) {
  const { nome, email, assunto, mensagem } = req.body;
  if (!nome || !email || !mensagem) {
    return res.status(400).json({ erro: 'nome, email e mensagem são obrigatórios.' });
  }

  // TODO: salvar em tabela ou enviar e-mail (ex.: nodemailer)
  console.log('[Contato]', { nome, email, assunto, mensagem });

  res.status(201).json({ mensagem: 'Mensagem enviada com sucesso.' });
}

module.exports = { enviar };
