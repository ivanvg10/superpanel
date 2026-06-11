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
      cannabisRes,
      weightLatestRes,
      weight7dRes,
      gymWeekRes,
      boxWeekRes,
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

      // Días sin cannabis (CURRENT_DATE - última fecha de log)
      pool.query(
        `SELECT (CURRENT_DATE - MAX(date))::integer AS days_since FROM cannabis_log WHERE user_id = $1`,
        [uid]
      ),

      // Último peso registrado
      pool.query(
        `SELECT weight_kg, date FROM weight_log WHERE user_id = $1 ORDER BY date DESC LIMIT 1`,
        [uid]
      ),

      // Peso de hace ≥7 días (para delta semanal)
      pool.query(
        `SELECT weight_kg FROM weight_log WHERE user_id = $1 AND date <= CURRENT_DATE - INTERVAL '6 days' ORDER BY date DESC LIMIT 1`,
        [uid]
      ),

      // Sesiones de gym en los últimos 7 días
      pool.query(
        `SELECT COUNT(*) AS count FROM gym_sessions WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'`,
        [uid]
      ),

      // Sesiones de box en los últimos 7 días
      pool.query(
        `SELECT COUNT(*) AS count FROM box_sessions WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '6 days'`,
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

    const latestWeight = weightLatestRes.rows[0] || null;
    const weight7d     = weight7dRes.rows[0] || null;

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
      cannabis_streak:  cannabisRes.rows[0]?.days_since ?? null,
      weight: latestWeight
        ? {
            kg:       parseFloat(latestWeight.weight_kg),
            date:     latestWeight.date,
            delta_7d: weight7d
              ? parseFloat((latestWeight.weight_kg - weight7d.weight_kg).toFixed(1))
              : null,
          }
        : null,
      gym_week:         parseInt(gymWeekRes.rows[0].count, 10),
      box_week:         parseInt(boxWeekRes.rows[0].count, 10),
      urgent_todos:     todosRes.rows,
      reminders_due:    remindersRes.rows,
    });
  } catch (err) {
    console.error('[dashboard GET]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
