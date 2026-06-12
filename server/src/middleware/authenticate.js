const jwt = require('jsonwebtoken');
const pool = require('../db');

// Obtiene el token de la cabecera Authorization (Bearer) o, si no, de la cookie.
// El header es la vía principal: Safari iOS bloquea las cookies cross-site (ITP),
// así que el móvil autentica vía Bearer + localStorage.
function getToken(req) {
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return h.slice(7);
  return req.cookies?.token;
}

// Middleware reutilizable para rutas protegidas en futuras etapas
async function authenticate(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'No autenticado' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT id, email, name FROM users WHERE id = $1',
      [payload.userId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

authenticate.getToken = getToken;
module.exports = authenticate;
