const { Pool } = require('pg');

// Conexión de solo lectura/escritura a la BD de Chai Fit (Railway).
// rejectUnauthorized: false es necesario para el cert autofirmado de Railway
// (mismo tradeoff aceptado que en db/index.js).
const pool = new Pool({
  connectionString: process.env.CHAIFIT_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});

module.exports = pool;
