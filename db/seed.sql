-- ============================================================
--  SoulSpace – Dados de Teste (Catálogos)
--  Execute APÓS schema.sql
-- ============================================================

-- Meditações (igual ao front-end MEDITATIONS)
INSERT INTO Medite_e_relaxe (titulo, descricao, categoria, duracao, nivel) VALUES
  ('Respiração para Iniciantes', 'Uma introdução suave à meditação focada na respiração', 'Respiração', '5 min', 'Iniciante'),
  ('Relaxamento Profundo',       'Libere as tensões e encontre paz e tranquilidade',       'Relaxamento', '15 min', 'Intermediário'),
  ('Mindfulness Matinal',        'Comece seu dia com clareza e foco',                       'Mindfulness', '10 min', 'Todos os níveis'),
  ('Sono Profundo',              'Meditação guiada para uma noite de sono reparadora',      'Sono', '20 min', 'Todos os níveis'),
  ('Foco no Trabalho',           'Recupere a concentração entre tarefas',                   'Foco', '8 min', 'Intermediário'),
  ('Alívio da Ansiedade',        'Técnicas de respiração 4-7-8 para acalmar a mente',       'Ansiedade', '12 min', 'Iniciante');

-- Exercícios físicos (igual ao front-end WORKOUTS)
INSERT INTO Exercicio_Fisico (titulo, categoria, duracao, descricao, grupo_muscular, nivel_dificuldade) VALUES
  ('Hiit para correr na esteira', 'Cardio', '30 min', 'Acompanhe as orientações do app e regule sua esteira para seguir as instruções do SoulHiit', 'Corpo todo', 'Intermediário'),
  ('Momento Relax',               'Yoga',   '15 min', 'Siga as instruções do aplicativo para fazer seu treino de Yoga com base no seu condicionamento', 'Flexibilidade', 'Iniciante'),
  ('Treino de Força',             'Força',  '50 min', 'Treino de superiores, pode ser feito na academia ou improvisado com o que você tiver em casa', 'Superiores', 'Intermediário'),
  ('Alongamento Matinal',         'Alongamento', '12 min', 'Sequência completa para acordar o corpo com suavidade', 'Corpo todo', 'Iniciante');

-- Usuário de teste (senha: senha123 -> hash bcrypt)
-- Gere o hash real com: bcrypt.hashSync('senha123', 10)
INSERT INTO Usuario (Nome, email, senha, cpf, contato) VALUES
  ('Julia Dantas', 'julia@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '11122233344', '11999990000');
