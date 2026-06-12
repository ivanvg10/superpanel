const router = require('express').Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// ─── TODOS ────────────────────────────────────────────────────────────────────

router.get('/todos', async (req, res) => {
  try {
    const { project, status } = req.query;
    const params = [req.user.id];
    let where = 'WHERE user_id = $1';

    if (project && project !== 'all') {
      params.push(project);
      where += ` AND project = $${params.length}`;
    }
    if (status) {
      params.push(status);
      where += ` AND status = $${params.length}`;
    }

    const { rows } = await pool.query(
      `SELECT * FROM todos ${where}
       ORDER BY
         CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         due_date ASC NULLS LAST,
         created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('[todos GET]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/todos', async (req, res) => {
  try {
    const { title, description, project = 'personal', priority = 'medium', due_date } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Título requerido' });

    const { rows } = await pool.query(
      `INSERT INTO todos (user_id, title, description, project, priority, due_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, title.trim(), description || null, project, priority, due_date || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[todos POST]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.patch('/todos/:id', async (req, res) => {
  try {
    const { title, description, project, priority, due_date, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE todos SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         project     = COALESCE($3, project),
         priority    = COALESCE($4, priority),
         due_date    = COALESCE($5, due_date),
         status      = COALESCE($6, status),
         updated_at  = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [title, description, project, priority, due_date, status, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[todos PATCH]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/todos/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[todos DELETE]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── GYM ──────────────────────────────────────────────────────────────────────

router.get('/gym', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM gym_sessions WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[gym GET]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/gym', async (req, res) => {
  try {
    const { date, duration_minutes, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO gym_sessions (user_id, date, duration_minutes, notes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, date || 'NOW()', duration_minutes || null, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[gym POST]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/gym/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM gym_sessions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[gym DELETE]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── BOX ──────────────────────────────────────────────────────────────────────

router.get('/box', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM box_sessions WHERE user_id = $1 ORDER BY date DESC, created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[box GET]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/box', async (req, res) => {
  try {
    const { date, duration_minutes, rounds, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO box_sessions (user_id, date, duration_minutes, rounds, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, date || 'NOW()', duration_minutes || null, rounds || null, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[box POST]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/box/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM box_sessions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[box DELETE]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── PESO ─────────────────────────────────────────────────────────────────────

router.get('/weight', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM weight_log WHERE user_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[weight GET]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/weight', async (req, res) => {
  try {
    const { date, weight_kg, notes } = req.body;
    if (!weight_kg) return res.status(400).json({ error: 'Peso requerido' });

    const { rows } = await pool.query(
      `INSERT INTO weight_log (user_id, date, weight_kg, notes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date) DO UPDATE SET weight_kg = $3, notes = $4
       RETURNING *`,
      [req.user.id, date || new Date().toISOString().split('T')[0], weight_kg, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[weight POST]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/weight/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM weight_log WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[weight DELETE]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── RECORDATORIOS ────────────────────────────────────────────────────────────

router.get('/reminders', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM reminders WHERE user_id = $1
       ORDER BY is_done ASC, due_at ASC NULLS LAST, created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[reminders GET]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.post('/reminders', async (req, res) => {
  try {
    const { title, description, due_at } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Título requerido' });

    const { rows } = await pool.query(
      `INSERT INTO reminders (user_id, title, description, due_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title.trim(), description || null, due_at || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[reminders POST]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.patch('/reminders/:id', async (req, res) => {
  try {
    const { title, description, due_at, is_done } = req.body;
    const { rows } = await pool.query(
      `UPDATE reminders SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         due_at      = COALESCE($3, due_at),
         is_done     = COALESCE($4, is_done)
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [title, description, due_at, is_done, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[reminders PATCH]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.delete('/reminders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reminders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[reminders DELETE]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
