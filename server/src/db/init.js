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

    CREATE TABLE IF NOT EXISTS gym_sessions (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date             DATE NOT NULL DEFAULT CURRENT_DATE,
      duration_minutes INTEGER,
      notes            TEXT,
      created_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS box_sessions (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date             DATE NOT NULL DEFAULT CURRENT_DATE,
      duration_minutes INTEGER,
      rounds           INTEGER,
      notes            TEXT,
      created_at       TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS weight_log (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date       DATE NOT NULL DEFAULT CURRENT_DATE,
      weight_kg  DECIMAL(5,2) NOT NULL,
      notes      TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, date)
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
