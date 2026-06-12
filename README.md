# SoulSpace — App + API (versão conectada)

Este pacote contém o **back-end** (Node.js + Express + MySQL) e o **front-end**
(`App.jsx`, React) já adaptado para consumir a API real via `fetch()`.

---

## 1. Banco de dados (MySQL)

```bash
mysql -u root -p -e "CREATE DATABASE soulspace;"
mysql -u root -p soulspace < db/schema.sql
mysql -u root -p soulspace < db/seed.sql
```

> O `seed.sql` já cria as 6 meditações e 4 treinos usados no front-end,
> além de um usuário de teste:
> - e-mail: `julia@email.com`
> - senha: `senha123`

---

## 2. Back-end (API)

```bash
npm install
```

Configure as variáveis de ambiente (opcional, valores padrão já funcionam com MySQL local sem senha):

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=soulspace
export DB_USER=root
export DB_PASSWORD=
export JWT_SECRET=soulspace_secret_2026
export PORT=3000
```

Inicie a API:

```bash
npm start          # produção
npm run dev        # desenvolvimento (nodemon)
```

A API estará em `http://localhost:3000/api`.
Teste com: `curl http://localhost:3000/api/health`

---

## 3. Front-end (App.jsx)

O `App.jsx` já está configurado para falar com `http://localhost:3000/api`
(constante `API_URL` no topo do arquivo).

### Opção A — Vite (recomendado)

```bash
npm create vite@latest soulspace-front -- --template react
cd soulspace-front
npm install
# substitua src/App.jsx pelo App.jsx deste pacote
npm run dev
```

### Opção B — Create React App

```bash
npx create-react-app soulspace-front
cd soulspace-front
# substitua src/App.js pelo App.jsx deste pacote
npm start
```

---

## 4. Modo offline

Se a API não estiver rodando, o app detecta isso (`GET /api/health` falha) e
exibe um banner amarelo "modo offline", usando dados estáticos de demonstração
(meditações e treinos fixos). Cadastro, login e progresso ficam desabilitados
até a API responder.

---

## 5. Rotas da API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST   | `/api/auth/cadastro` | — | Criar conta |
| POST   | `/api/auth/login` | — | Login (retorna JWT) |
| GET    | `/api/auth/me` | sim | Dados do usuário + progresso |
| PUT    | `/api/auth/me` | sim | Atualizar perfil |
| GET    | `/api/meditacoes` | — | Listar meditações |
| POST   | `/api/meditacoes/:id/toggle` | sim | Marcar/desmarcar concluída |
| GET    | `/api/exercicios` | — | Listar treinos |
| POST   | `/api/exercicios/:id/toggle` | sim | Marcar/desmarcar concluído |
| GET    | `/api/diario` | sim | Listar anotações do diário |
| POST   | `/api/diario` | sim | Criar anotação |
| DELETE | `/api/diario/:id` | sim | Remover anotação |
| POST   | `/api/contato` | — | Enviar mensagem de contato |
| GET    | `/api/health` | — | Health check |

Todas as rotas autenticadas exigem o header:
```
Authorization: Bearer <token>
```
