const router     = require('express').Router();
const authenticate = require('../middleware/authenticate');
const chaifit    = require('../db/chaifit');

const LEON = '00000000-0000-0000-0000-000000000001';

router.use(authenticate);

// ── Cuestionarios ─────────────────────────────────────────────────────────────

router.get('/cuestionarios', async (_req, res) => {
  try {
    const [base, pro] = await Promise.all([
      chaifit.query(`
        SELECT cb.*, c.nombre, c.usuario, c.plan
        FROM cuestionario_base cb
        JOIN clientes c ON c.id = cb.cliente_id
        WHERE cb.tenant_id = $1
        ORDER BY cb.revisado ASC, cb.creado_en DESC
      `, [LEON]).then(r => r.rows),
      chaifit.query(`
        SELECT cp.*, c.nombre, c.usuario, c.plan
        FROM cuestionario_pro cp
        JOIN clientes c ON c.id = cp.cliente_id
        WHERE cp.tenant_id = $1
        ORDER BY cp.revisado ASC, cp.creado_en DESC
      `, [LEON]).then(r => r.rows),
    ]);
    res.json({ base, pro });
  } catch (err) {
    console.error('[leon-coach GET /cuestionarios]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/cuestionario-base/:id/revisar', async (req, res) => {
  try {
    await chaifit.query(
      `UPDATE cuestionario_base SET revisado = true, revisado_en = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[leon-coach PUT /cuestionario-base/revisar]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/cuestionario-pro/:id/revisar', async (req, res) => {
  try {
    await chaifit.query(
      `UPDATE cuestionario_pro SET revisado = true, revisado_en = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[leon-coach PUT /cuestionario-pro/revisar]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Embudo ────────────────────────────────────────────────────────────────────

router.get('/funnel', async (_req, res) => {
  try {
    const [total, onboarding, pago, conCuest, porMes] = await Promise.all([
      chaifit.query(
        `SELECT COUNT(*) FROM clientes WHERE tenant_id = $1 AND estado != 'borrado'`,
        [LEON]
      ).then(r => r.rows[0]),
      chaifit.query(
        `SELECT COUNT(*) FROM clientes WHERE tenant_id = $1 AND onboarding_objetivo IS NOT NULL AND estado != 'borrado'`,
        [LEON]
      ).then(r => r.rows[0]),
      chaifit.query(
        `SELECT COUNT(*), plan FROM clientes WHERE tenant_id = $1 AND plan != 'gratuito' AND estado != 'borrado' GROUP BY plan`,
        [LEON]
      ).then(r => r.rows),
      chaifit.query(
        `SELECT COUNT(DISTINCT cliente_id) FROM cuestionario_base WHERE tenant_id = $1`,
        [LEON]
      ).then(r => r.rows[0]),
      chaifit.query(`
        SELECT TO_CHAR(fecha_inicio, 'YYYY-MM') AS mes, COUNT(*) AS registros
        FROM clientes
        WHERE tenant_id = $1 AND estado != 'borrado'
          AND fecha_inicio >= NOW() - INTERVAL '6 months'
        GROUP BY mes ORDER BY mes ASC
      `, [LEON]).then(r => r.rows),
    ]);
    res.json({
      total:            parseInt(total.count),
      onboarding:       parseInt(onboarding.count),
      con_cuestionario: parseInt(conCuest.count),
      planes_pago:      pago,
      por_mes:          porMes,
    });
  } catch (err) {
    console.error('[leon-coach GET /funnel]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Clientes ──────────────────────────────────────────────────────────────────

router.get('/clientes', async (_req, res) => {
  try {
    const { rows } = await chaifit.query(`
      SELECT
        c.id, c.usuario, c.nombre, c.email, c.plan,
        c.fecha_inicio, c.fecha_vence, c.estado,
        c.stripe_subscription_id,
        CASE WHEN c.fecha_vence IS NULL THEN NULL
             ELSE (c.fecha_vence::date - CURRENT_DATE) END AS dias,
        (SELECT MAX(creado_en) FROM checkouts ch WHERE ch.cliente_id = c.id) AS ultima_sesion,
        EXISTS(SELECT 1 FROM cuestionario_base cb WHERE cb.cliente_id = c.id) AS tiene_cuestionario_base,
        EXISTS(SELECT 1 FROM cuestionario_pro  cp WHERE cp.cliente_id = c.id) AS tiene_cuestionario_pro,
        (SELECT nota FROM notas_internas ni WHERE ni.cliente_id = c.id ORDER BY creado_en DESC LIMIT 1) AS ultima_nota
      FROM clientes c
      WHERE c.tenant_id = $1 AND c.estado != 'borrado'
      ORDER BY c.fecha_inicio DESC
    `, [LEON]);
    res.json({ clientes: rows });
  } catch (err) {
    console.error('[leon-coach GET /clientes]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

router.put('/clientes/:usuario', async (req, res) => {
  try {
    const { usuario } = req.params;
    const { plan, fecha_vence, nota } = req.body;

    const { rows } = await chaifit.query(
      `SELECT id FROM clientes WHERE usuario = $1 AND tenant_id = $2`,
      [usuario, LEON]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
    const clienteId = rows[0].id;

    if (plan !== undefined || fecha_vence !== undefined) {
      const cols = [], vals = [];
      if (plan        !== undefined) { cols.push(`plan = $${cols.length + 1}`);        vals.push(plan); }
      if (fecha_vence !== undefined) { cols.push(`fecha_vence = $${cols.length + 1}`); vals.push(fecha_vence || null); }
      vals.push(clienteId);
      await chaifit.query(`UPDATE clientes SET ${cols.join(', ')} WHERE id = $${vals.length}`, vals);
    }
    if (nota) {
      await chaifit.query(
        `INSERT INTO notas_internas (cliente_id, tenant_id, texto, creado_en) VALUES ($1, $2, $3, NOW())`,
        [clienteId, LEON, nota]
      ).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[leon-coach PUT /clientes/:usuario]', err.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ── Planes (solo lectura desde env) ──────────────────────────────────────────

router.get('/planes', (_req, res) => {
  res.json({
    planes: [
      { clave: 'base_mensual',    nombre: 'Base Mensual',    precio: '$1,200 MXN',  periodo: '1 mes',    price_id: process.env.LC_PRICE_BASE_MENSUAL    || '' },
      { clave: 'base_trimestral', nombre: 'Base Trimestral', precio: '$3,000 MXN',  periodo: '3 meses',  price_id: process.env.LC_PRICE_BASE_TRIMESTRAL || '' },
      { clave: 'base_semestral',  nombre: 'Base Semestral',  precio: '$5,760 MXN',  periodo: '6 meses',  price_id: process.env.LC_PRICE_BASE_SEMESTRAL  || '' },
      { clave: 'base_anual',      nombre: 'Base Anual',      precio: '$10,800 MXN', periodo: '12 meses', price_id: process.env.LC_PRICE_BASE_ANUAL      || '' },
      { clave: 'pro_mensual',     nombre: 'Pro Mensual',     precio: '$2,000 MXN',  periodo: '1 mes',    price_id: process.env.LC_PRICE_PRO_MENSUAL     || '' },
      { clave: 'pro_trimestral',  nombre: 'Pro Trimestral',  precio: '$5,000 MXN',  periodo: '3 meses',  price_id: process.env.LC_PRICE_PRO_TRIMESTRAL  || '' },
      { clave: 'pro_semestral',   nombre: 'Pro Semestral',   precio: '$9,600 MXN',  periodo: '6 meses',  price_id: process.env.LC_PRICE_PRO_SEMESTRAL   || '' },
      { clave: 'pro_anual',       nombre: 'Pro Anual',       precio: '$18,000 MXN', periodo: '12 meses', price_id: process.env.LC_PRICE_PRO_ANUAL       || '' },
    ],
  });
});

module.exports = router;
