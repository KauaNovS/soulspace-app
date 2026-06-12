// scripts/setup-db.js
// Roda schema.sql e seed.sql contra o banco configurado em .env
// Uso: node scripts/setup-db.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
  });

  console.log('Conectado ao banco:', process.env.DB_HOST);

  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  const seed   = fs.readFileSync(path.join(__dirname, '..', 'db', 'seed.sql'), 'utf8');

  console.log('Executando schema.sql...');
  await connection.query(schema);
  console.log('✅ Schema criado.');

  console.log('Executando seed.sql...');
  await connection.query(seed);
  console.log('✅ Seed inserido.');

  await connection.end();
  console.log('Concluído!');
}

run().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
