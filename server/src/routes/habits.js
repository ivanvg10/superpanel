const router = require('express').Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// ─── Helpers de semana (lunes como inicio, igual que date_trunc('week') de PG) ──

function mondayOf(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = lunes
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
const isoDay = (d) => new Date(d).toISOString().slice(0, 10);

// Racha de semanas cumplidas consecutivas. La semana en curso solo SUMA si ya
// alcanzó la meta; si aún no, no rompe la racha de semanas anteriores.
function streakWeeks(weekCountMap, goal) {
  if (goal <= 0) return 0;
  let streak = 0;
  const cursor = mondayOf(new Date());
  const curKey = isoDay(cursor);
  if ((weekCountMap[curKey] || 0) >= goal) streak++;
  cursor.setDate(cursor.getDate() - 7);
  for (let i = 0; i < 52; i++) {
    const key = isoDay(cursor);
    if ((weekCountMap[key] || 0) >= goal) { streak++; cursor.setDate(cursor.getDate() - 7); }
    else break;
  }
  return streak;
}

// ─── GET /habits — lista con progreso semanal, check de hoy y racha ─────────────

router.get('/', async (req, res) => {
  const uid = req.user.id;
  try {
    const habitsRes = await pool.query(
      `SELECT id, name, color, icon, weekly_goal, sort_order
       FROM habits WHERE user_id = $1 AND archived = FALSE
       ORDER BY sort_order ASC, id ASC`,
      [uid]
    );
    const habits = habitsRes.rows;
    if (habits.length === 0) return res.json([]);

    const ids = habits.map((h) => h.id);

    const [weekRes, todayRes, aggRes] = await Promise.all([
      pool.query(
        `SELECT habit_id, COUNT(*)::int AS c FROM habit_checks
         WHERE habit_id = ANY($1::int[]) AND date >= date_trunc('week', CURRENT_DATE)
         GROUP BY habit_id`, [ids]
      ),
      pool.query(
        `SELECT habit_id FROM habit_checks
         WHERE habit_id = ANY($1::int[]) AND date = CURRENT_DATE`, [ids]
      ),
      pool.query(
        `SELECT habit_id, to_char(date_trunc('week', date), 'YYYY-MM-DD') AS wk, COUNT(*)::int AS c
         FROM habit_checks
         WHERE habit_id = ANY($1::int[]) AND date >= CURRENT_DATE - INTERVAL '52 weeks'
         GROUP BY habit_id, wk`, [ids]
      ),
    ]);

    const weekCount = {};
    weekRes.rows.forEach((r) => { weekCount[r.habit_id] = r.c; });
    const doneToday = new Set(todayRes.rows.map((r) => r.habit_id));
    const aggByHabit = {};
    aggRes.rows.forEach((r) => {
      (aggByHabit[r.habit_id] ||= {})[r.wk] = r.c;
    });

    res.json(habits.map((h) => ({
      ...h,
      week_count:   weekCount[h.id] || 0,
      done_today:   doneToday.has(h.id),
      streak_weeks: streakWeeks(aggByHabit[h.id] || {}, h.weekly_goal),
    })));
  } catch (err) {
    console.error('[habits GET]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── GET /habits/:id/history — últimos 28 días (para el mini-calendario) ─────────

router.get('/:id/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT to_char(hc.date, 'YYYY-MM-DD') AS date
       FROM habit_checks hc
       JOIN habits h ON h.id = hc.habit_id
       WHERE h.id = $1 AND h.user_id = $2 AND hc.date >= CURRENT_DATE - INTERVAL '27 days'`,
      [req.params.id, req.user.id]
    );
    res.json(rows.map((r) => r.date));
  } catch (err) {
    console.error('[habits history]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── POST /habits — crear ───────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { name, color = 'blue', icon = 'check', weekly_goal = 7 } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    const goal = Math.min(7, Math.max(1, parseInt(weekly_goal, 10) || 7));

    const { rows } = await pool.query(
      `INSERT INTO habits (user_id, name, color, icon, weekly_goal, sort_order)
       VALUES ($1, $2, $3, $4, $5, COALESCE((SELECT MAX(sort_order)+1 FROM habits WHERE user_id=$1), 0))
       RETURNING *`,
      [req.user.id, name.trim(), color, icon, goal]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[habits POST]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── PATCH /habits/:id — editar ─────────────────────────────────────────────────

router.patch('/:id', async (req, res) => {
  try {
    const { name, color, icon, weekly_goal } = req.body;
    const goal = weekly_goal == null ? null : Math.min(7, Math.max(1, parseInt(weekly_goal, 10) || 1));
    const { rows } = await pool.query(
      `UPDATE habits SET
         name        = COALESCE($1, name),
         color       = COALESCE($2, color),
         icon        = COALESCE($3, icon),
         weekly_goal = COALESCE($4, weekly_goal)
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name?.trim() || null, color || null, icon || null, goal, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[habits PATCH]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── DELETE /habits/:id ─────────────────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM habits WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[habits DELETE]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── POST /habits/:id/toggle — marca/desmarca un día (hoy por defecto) ───────────

router.post('/:id/toggle', async (req, res) => {
  try {
    // Verifica propiedad del hábito
    const own = await pool.query('SELECT id FROM habits WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!own.rows[0]) return res.status(404).json({ error: 'No encontrado' });

    const date = req.body?.date || new Date().toISOString().slice(0, 10);
    const del = await pool.query(
      'DELETE FROM habit_checks WHERE habit_id = $1 AND date = $2 RETURNING id',
      [req.params.id, date]
    );
    let checked = false;
    if (del.rowCount === 0) {
      await pool.query('INSERT INTO habit_checks (habit_id, date) VALUES ($1, $2)', [req.params.id, date]);
      checked = true;
    }
    res.json({ checked, date });
  } catch (err) {
    console.error('[habits toggle]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
