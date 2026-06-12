const router = require('express').Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');
const { esEspejo, resumenEspejo } = require('../services/espejoChaifit');

router.use(authenticate);

router.get('/', async (req, res) => {
  const uid = req.user.id;
  try {
    const [
      businessesRes,
      habitsRes,
      todosRes,
      remindersRes,
    ] = await Promise.all([
      // Negocios con stats del mes actual
      pool.query(`
        SELECT
          b.*,
          COALESCE((
            SELECT SUM(t.amount) FROM transactions t
            WHERE t.business_id = b.id AND t.type = 'income'
              AND t.is_recurring = TRUE
              AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
          ), 0) AS mrr,
          COALESCE((
            SELECT SUM(t.amount) FROM transactions t
            WHERE t.business_id = b.id AND t.type = 'income'
              AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
          ), 0) AS income_month,
          COALESCE((
            SELECT SUM(t.amount) FROM transactions t
            WHERE t.business_id = b.id AND t.type = 'expense'
              AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
          ), 0) AS expenses_month,
          (SELECT COUNT(*) FROM todos WHERE user_id = b.user_id AND project = b.slug AND status != 'done') AS pending_todos
        FROM businesses b
        WHERE b.user_id = $1
        ORDER BY b.created_at ASC
      `, [uid]),

      // Hábitos con progreso de la semana actual y check de hoy
      pool.query(
        `SELECT h.id, h.name, h.color, h.weekly_goal,
           (SELECT COUNT(*)::int FROM habit_checks c
              WHERE c.habit_id = h.id AND c.date >= date_trunc('week', CURRENT_DATE)) AS week_count,
           EXISTS(SELECT 1 FROM habit_checks c
              WHERE c.habit_id = h.id AND c.date = CURRENT_DATE) AS done_today
         FROM habits h
         WHERE h.user_id = $1 AND h.archived = FALSE
         ORDER BY h.sort_order ASC, h.id ASC`,
        [uid]
      ),

      // Tareas pendientes urgentes/altas (top 6)
      pool.query(
        `SELECT id, title, project, priority, due_date FROM todos
         WHERE user_id = $1 AND status != 'done' AND priority IN ('urgent', 'high')
         ORDER BY
           CASE priority WHEN 'urgent' THEN 1 ELSE 2 END,
           due_date ASC NULLS LAST
         LIMIT 6`,
        [uid]
      ),

      // Recordatorios: vencidos o próximos 7 días, no completados
      pool.query(
        `SELECT id, title, due_at FROM reminders
         WHERE user_id = $1 AND is_done = FALSE
           AND (due_at IS NULL OR due_at <= NOW() + INTERVAL '7 days')
         ORDER BY due_at ASC NULLS LAST
         LIMIT 5`,
        [uid]
      ),
    ]);

    // Espejo: suma ingresos reales (Stripe/pagos) del mes actual al consolidado.
    const ymActual = new Date().toISOString().slice(0, 7);
    await Promise.all(businessesRes.rows.map(async (b) => {
      if (!esEspejo(b.slug)) return;
      const { byMonth, mrr } = await resumenEspejo(b.slug);
      b.income_month = Number(b.income_month) + (byMonth[ymActual] || 0);
      b.mrr          = Number(b.mrr) + mrr;
    }));

    res.json({
      businesses:       businessesRes.rows,
      habits:           habitsRes.rows,
      urgent_todos:     todosRes.rows,
      reminders_due:    remindersRes.rows,
    });
  } catch (err) {
    console.error('[dashboard GET]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
