const pool = require('./index');

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name          VARCHAR(255) NOT NULL DEFAULT 'Iván León',
      created_at    TIMESTAMP DEFAULT NOW()
    );

    -- ── NEGOCIOS ──────────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS businesses (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      slug        VARCHAR(50)  NOT NULL,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      url         VARCHAR(500),
      admin_url   VARCHAR(500),
      status      VARCHAR(30)  DEFAULT 'construccion',
      color       VARCHAR(20)  DEFAULT 'blue',
      created_at  TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, slug)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
      business_id  INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
      type         VARCHAR(10)  NOT NULL CHECK (type IN ('income','expense')),
      amount       DECIMAL(12,2) NOT NULL CHECK (amount > 0),
      description  VARCHAR(500),
      category     VARCHAR(100),
      date         DATE NOT NULL DEFAULT CURRENT_DATE,
      is_recurring BOOLEAN DEFAULT FALSE,
      created_at   TIMESTAMP DEFAULT NOW()
    );

    -- ── PERSONAL ──────────────────────────────────────────────────

    CREATE TABLE IF NOT EXISTS todos (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title       VARCHAR(500) NOT NULL,
      description TEXT,
      project     VARCHAR(50)  DEFAULT 'personal',
      priority    VARCHAR(20)  DEFAULT 'medium',
      status      VARCHAR(20)  DEFAULT 'pending',
      due_date    DATE,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    );

    -- Tracker de hábitos: cada hábito tiene una meta semanal (veces/semana).
    CREATE TABLE IF NOT EXISTS habits (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name        VARCHAR(100) NOT NULL,
      color       VARCHAR(20)  DEFAULT 'blue',
      icon        VARCHAR(40)  DEFAULT 'check',
      weekly_goal INTEGER NOT NULL DEFAULT 7,
      sort_order  INTEGER DEFAULT 0,
      archived    BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT NOW()
    );

    -- Un check = el hábito se cumplió ese día (1 por día como máximo).
    CREATE TABLE IF NOT EXISTS habit_checks (
      id         SERIAL PRIMARY KEY,
      habit_id   INTEGER REFERENCES habits(id) ON DELETE CASCADE,
      date       DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(habit_id, date)
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title       VARCHAR(500) NOT NULL,
      description TEXT,
      due_at      TIMESTAMP,
      is_done     BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('DB: tablas listas');
}

module.exports = initDB;
