const router = require('express').Router();
const pool = require('../db');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// ─── BUSINESSES ───────────────────────────────────────────────────────────────

// GET /negocios — lista con stats del mes actual
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        b.*,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.business_id = b.id
            AND t.type = 'income'
            AND t.is_recurring = TRUE
            AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0) AS mrr,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.business_id = b.id
            AND t.type = 'income'
            AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0) AS income_month,
        COALESCE((
          SELECT SUM(t.amount) FROM transactions t
          WHERE t.business_id = b.id
            AND t.type = 'expense'
            AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0) AS expenses_month,
        (
          SELECT COUNT(*) FROM todos
          WHERE user_id = b.user_id AND project = b.slug AND status != 'done'
        ) AS pending_todos
      FROM businesses b
      WHERE b.user_id = $1
      ORDER BY b.created_at ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('[negocios GET /]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /negocios/:slug — detalle + transacciones del mes + todos pendientes
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { month } = req.query; // YYYY-MM
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const { rows: [business] } = await pool.query(
      'SELECT * FROM businesses WHERE slug = $1 AND user_id = $2',
      [slug, req.user.id]
    );
    if (!business) return res.status(404).json({ error: 'Negocio no encontrado' });

    const { rows: transactions } = await pool.query(
      `SELECT * FROM transactions
       WHERE business_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
       ORDER BY date DESC, created_at DESC`,
      [business.id, targetMonth]
    );

    const { rows: todos } = await pool.query(
      `SELECT * FROM todos
       WHERE user_id = $1 AND project = $2 AND status != 'done'
       ORDER BY
         CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
         due_date ASC NULLS LAST`,
      [req.user.id, slug]
    );

    // Histórico mensual: últimos 6 meses para sparkline
    const { rows: history } = await pool.query(
      `SELECT
         TO_CHAR(date, 'YYYY-MM') AS month,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
       FROM transactions
       WHERE business_id = $1
         AND date >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY TO_CHAR(date, 'YYYY-MM')
       ORDER BY month ASC`,
      [business.id]
    );

    // MRR real: siempre del mes en curso (no del mes seleccionado)
    const { rows: [mrrRow] } = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS current_mrr
       FROM transactions
       WHERE business_id = $1
         AND type = 'income'
         AND is_recurring = TRUE
         AND DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)`,
      [business.id]
    );

    res.json({ business, transactions, todos, history, currentMrr: Number(mrrRow.current_mrr) });
  } catch (err) {
    console.error('[negocios GET /:slug]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PATCH /negocios/:slug — actualiza datos del negocio (status, urls, etc.)
router.patch('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { name, description, url, admin_url, status, color } = req.body;

    const { rows: [biz] } = await pool.query(
      `UPDATE businesses SET
         name        = COALESCE($1, name),
         description = COALESCE($2, description),
         url         = COALESCE($3, url),
         admin_url   = COALESCE($4, admin_url),
         status      = COALESCE($5, status),
         color       = COALESCE($6, color)
       WHERE slug = $7 AND user_id = $8 RETURNING *`,
      [name, description, url, admin_url, status, color, slug, req.user.id]
    );
    if (!biz) return res.status(404).json({ error: 'Negocio no encontrado' });
    res.json(biz);
  } catch (err) {
    console.error('[negocios PATCH /:slug]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /negocios — crea un nuevo negocio
router.post('/', async (req, res) => {
  try {
    const { name, description, url, admin_url, status, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });

    const slug = name.trim().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50) || 'negocio';

    const { rows: [biz] } = await pool.query(
      `INSERT INTO businesses (user_id, slug, name, description, url, admin_url, status, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id, slug, name.trim(),
        description?.trim() || null,
        url?.trim() || null,
        admin_url?.trim() || null,
        status || 'construccion',
        color || 'blue',
      ]
    );
    res.status(201).json(biz);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un negocio con ese nombre' });
    }
    console.error('[negocios POST /]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

// POST /negocios/:slug/transactions
router.post('/:slug/transactions', async (req, res) => {
  try {
    const { slug } = req.params;
    const { type, amount, description, category, date, is_recurring } = req.body;

    if (!type || !amount) return res.status(400).json({ error: 'Tipo y monto requeridos' });
    if (!['income', 'expense'].includes(type)) return res.status(400).json({ error: 'Tipo inválido' });
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
      return res.status(400).json({ error: 'Monto debe ser mayor a 0' });

    const { rows: [biz] } = await pool.query(
      'SELECT id FROM businesses WHERE slug = $1 AND user_id = $2',
      [slug, req.user.id]
    );
    if (!biz) return res.status(404).json({ error: 'Negocio no encontrado' });

    const { rows: [txn] } = await pool.query(
      `INSERT INTO transactions (user_id, business_id, type, amount, description, category, date, is_recurring)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id, biz.id, type, parseFloat(amount),
        description?.trim() || null,
        category || null,
        date || new Date().toISOString().split('T')[0],
        Boolean(is_recurring),
      ]
    );
    res.status(201).json(txn);
  } catch (err) {
    console.error('[negocios POST /:slug/transactions]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /negocios/transactions/:id  — antes de /:slug para que Express no lo confunda
router.delete('/transactions/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[transactions DELETE]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
