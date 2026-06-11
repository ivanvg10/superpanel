// Espejo de ingresos desde la BD de Chai Fit (solo lectura).
//
// León Ventures NO es dueño de estos datos: cada negocio gestiona lo suyo en su
// propio panel (chaifit/superadmin, leoncoach/superadmin). Aquí solo se leen en
// vivo para tener la gestión financiera global automática.
//
//   chai-fit   → tabla `pagos`           (suscripciones SaaS de entrenadores vía Stripe)
//   leon-coach → tabla `pagos_clientes`  (pagos de clientes de León, tenant LEON)
//
// Tolerante a fallos: si la BD de Chai Fit no responde o el esquema difiere, se
// loguea y se devuelve vacío para que las transacciones manuales sigan visibles.

const chaifit = require('../db/chaifit');

const LEON = '00000000-0000-0000-0000-000000000001';

// Negocios cuyos ingresos se espejan en vivo desde Chai Fit.
const NEGOCIOS_ESPEJO = new Set(['chai-fit', 'leon-coach']);

const esEspejo = (slug) => NEGOCIOS_ESPEJO.has(slug);

// Indexa filas {ym, income} → { 'YYYY-MM': number }
const indexar = (rows) =>
  rows.reduce((acc, r) => { acc[r.ym] = Number(r.income); return acc; }, {});

// Resumen por mes (últimos 6) + MRR. Usado por el consolidado, la lista y el dashboard.
async function resumenEspejo(slug) {
  try {
    if (slug === 'chai-fit') {
      const [hist, mrr] = await Promise.all([
        chaifit.query(`
          SELECT TO_CHAR(creado_en, 'YYYY-MM') AS ym, SUM(monto)::float8 AS income
          FROM pagos
          WHERE estado = 'completado'
            AND creado_en >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
          GROUP BY ym
        `),
        chaifit.query(
          `SELECT COALESCE(SUM(precio_mensual), 0)::float8 AS mrr
           FROM suscripciones WHERE estado = 'activa'`
        ),
      ]);
      return { byMonth: indexar(hist.rows), mrr: Number(mrr.rows[0].mrr) };
    }

    if (slug === 'leon-coach') {
      const hist = await chaifit.query(`
        SELECT TO_CHAR(pc.fecha, 'YYYY-MM') AS ym, SUM(pc.monto)::float8 AS income
        FROM pagos_clientes pc
        JOIN clientes c ON c.id = pc.cliente_id
        WHERE c.tenant_id = $1
          AND pc.fecha >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY ym
      `, [LEON]);
      return { byMonth: indexar(hist.rows), mrr: 0 };
    }
  } catch (err) {
    console.error(`[espejoChaifit resumen ${slug}]`, err.message);
  }
  return { byMonth: {}, mrr: 0 };
}

// Da formato de transacción de solo lectura a una fila espejo.
const fmtEspejo = (descDefault) => (r) => ({
  id:           r.id,                                  // 'espejo-<id>' → nunca colisiona con ids locales
  type:         'income',
  amount:       Number(r.amount),
  description:  r.description || descDefault,
  category:     r.metodo || 'Stripe',
  date:         typeof r.date === 'string' ? r.date : new Date(r.date).toISOString(),
  is_recurring: false,
  origen:       'espejo',                              // el frontend lo marca como auto y no editable
});

// Movimientos individuales de un mes (YYYY-MM), como transacciones de solo lectura.
async function detalleEspejo(slug, mes) {
  try {
    if (slug === 'chai-fit') {
      const { rows } = await chaifit.query(`
        SELECT 'espejo-' || id AS id, monto AS amount, descripcion AS description, creado_en AS date
        FROM pagos
        WHERE estado = 'completado' AND TO_CHAR(creado_en, 'YYYY-MM') = $1
        ORDER BY creado_en DESC
      `, [mes]);
      return rows.map(fmtEspejo('Suscripción Chai Fit'));
    }

    if (slug === 'leon-coach') {
      const { rows } = await chaifit.query(`
        SELECT 'espejo-' || pc.id AS id, pc.monto AS amount, pc.nota AS description,
               pc.fecha AS date, pc.metodo
        FROM pagos_clientes pc
        JOIN clientes c ON c.id = pc.cliente_id
        WHERE c.tenant_id = $1 AND TO_CHAR(pc.fecha, 'YYYY-MM') = $2
        ORDER BY pc.fecha DESC
      `, [LEON, mes]);
      return rows.map(fmtEspejo('Pago de cliente'));
    }
  } catch (err) {
    console.error(`[espejoChaifit detalle ${slug}]`, err.message);
  }
  return [];
}

module.exports = { esEspejo, resumenEspejo, detalleEspejo };
