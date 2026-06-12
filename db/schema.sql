-- ============================================================
--  SoulSpace – Schema do Banco de Dados (MySQL)
--  Compatível com o front-end SoulSpace App (React + fetch)
-- ============================================================

CREATE TABLE Usuario (
    user_id   INT AUTO_INCREMENT PRIMARY KEY,
    Nome      VARCHAR(100) NOT NULL,
    Sobrenome VARCHAR(100),
    email     VARCHAR(150) UNIQUE NOT NULL,
    senha     VARCHAR(255) NOT NULL,
    cpf       VARCHAR(20),
    data_nasc DATE,
    contato   VARCHAR(20),
    endereco  VARCHAR(255),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Meu_Diario (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    titulo_anotacao     VARCHAR(150),
    texto_anotacao      TEXT,
    dataHora_anotacao   DATETIME DEFAULT CURRENT_TIMESTAMP,
    categHumor_anotacao VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES Usuario(user_id) ON DELETE CASCADE
);

CREATE TABLE Hora_do_Foco (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    user_id            INT NOT NULL,
    titulo_sessao      VARCHAR(100),
    duracao_sessao     TIME,
    Horainicio_sessao  TIME,
    HoraTermino_sessao TIME,
    criado_em          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Usuario(user_id) ON DELETE CASCADE
);

CREATE TABLE CVV (
    user_id    INT PRIMARY KEY,
    numero_cvv VARCHAR(10) DEFAULT '188',
    FOREIGN KEY (user_id) REFERENCES Usuario(user_id) ON DELETE CASCADE
);

CREATE TABLE SoulHear (
    user_id                 INT PRIMARY KEY,
    opcao_guardar_conversas BOOLEAN DEFAULT FALSE,
    historico_conversas     TEXT,
    FOREIGN KEY (user_id) REFERENCES Usuario(user_id) ON DELETE CASCADE
);

CREATE TABLE Medite_e_relaxe (
    id_meditacao INT AUTO_INCREMENT PRIMARY KEY,
    titulo       VARCHAR(150) NOT NULL,
    descricao    TEXT,
    categoria    VARCHAR(100),
    duracao      VARCHAR(20),
    audio_url    VARCHAR(255),
    imagem_url   VARCHAR(255),
    locutor      VARCHAR(100),
    nivel        VARCHAR(50) DEFAULT 'Todos os níveis'
);

CREATE TABLE Exercicio_Fisico (
    id_exercicio      INT AUTO_INCREMENT PRIMARY KEY,
    titulo            VARCHAR(150) NOT NULL,
    grupo_muscular    VARCHAR(100),
    nivel_dificuldade VARCHAR(50),
    categoria         VARCHAR(50),
    descricao         TEXT,
    duracao           VARCHAR(20),
    video_url         VARCHAR(255)
);

CREATE TABLE Plano_Alimentar (
    id_plano  INT AUTO_INCREMENT PRIMARY KEY,
    descricao TEXT,
    objetivo  VARCHAR(100),
    duracao   INT
);

CREATE TABLE Aprendizado (
    id_plataforma   INT AUTO_INCREMENT PRIMARY KEY,
    nome_plataforma VARCHAR(100),
    plataforma_url  VARCHAR(255)
);

CREATE TABLE Aula (
    id_aula         INT AUTO_INCREMENT PRIMARY KEY,
    id_curso        INT,
    titulo          VARCHAR(150),
    descricao       TEXT,
    url_video       VARCHAR(255),
    duracao_minutos INT,
    ordem           INT,
    FOREIGN KEY (id_curso) REFERENCES Usuario(user_id) ON DELETE CASCADE
);

-- ── Progresso do usuário (M:N entre Usuario e os catálogos) ──

CREATE TABLE Progresso_Meditacao (
    user_id      INT NOT NULL,
    id_meditacao INT NOT NULL,
    concluida    BOOLEAN DEFAULT TRUE,
    concluida_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, id_meditacao),
    FOREIGN KEY (user_id) REFERENCES Usuario(user_id) ON DELETE CASCADE,
    FOREIGN KEY (id_meditacao) REFERENCES Medite_e_relaxe(id_meditacao) ON DELETE CASCADE
);

CREATE TABLE Progresso_Exercicio (
    user_id      INT NOT NULL,
    id_exercicio INT NOT NULL,
    concluido    BOOLEAN DEFAULT TRUE,
    concluido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, id_exercicio),
    FOREIGN KEY (user_id) REFERENCES Usuario(user_id) ON DELETE CASCADE,
    FOREIGN KEY (id_exercicio) REFERENCES Exercicio_Fisico(id_exercicio) ON DELETE CASCADE
);
