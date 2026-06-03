const jwt = require('jsonwebtoken');
const pool = require('../db');

// Middleware reutilizable para rutas protegidas en futuras etapas
async function authenticate(req, res, next) {
  const token = req.cookies?.token;
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

module.exports = authenticate;
