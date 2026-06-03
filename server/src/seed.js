require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('./db');
const initDB = require('./db/init');

const BUSINESSES = [
  {
    slug:        'chai-fit',
    name:        'Chai Fit',
    description: 'Plataforma de fitness y bienestar',
    url:         'https://chaifit.app',
    admin_url:   'https://chaifit.app/admin',
    status:      'live',
    color:       'emerald',
  },
  {
    slug:        'leon-coach',
    name:        'León Coach',
    description: 'Coaching premium online',
    url:         'https://leoncoach.com',
    admin_url:   'https://leoncoach.com/admin',
    status:      'live',
    color:       'blue',
  },
  {
    slug:        'san-charly',
    name:        'San Charly MX',
    description: 'Negocio local en desarrollo',
    url:         'https://sancharlos.mx',
    admin_url:   null,
    status:      'construccion',
    color:       'amber',
  },
];

async function seed() {
  // Asegura que las tablas existan
  await initDB();

  const email    = (process.env.ADMIN_EMAIL    || 'ivan@leonventures.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('Falta ADMIN_PASSWORD en .env');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  const { rows: [user] } = await pool.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, 'Iván León')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email`,
    [email, hash]
  );
  console.log(`✓ Usuario: ${user.email}`);

  for (const biz of BUSINESSES) {
    await pool.query(
      `INSERT INTO businesses (user_id, slug, name, description, url, admin_url, status, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, slug) DO UPDATE SET
         name        = EXCLUDED.name,
         description = EXCLUDED.description,
         url         = EXCLUDED.url,
         admin_url   = COALESCE(EXCLUDED.admin_url, businesses.admin_url),
         status      = EXCLUDED.status,
         color       = EXCLUDED.color`,
      [user.id, biz.slug, biz.name, biz.description, biz.url, biz.admin_url, biz.status, biz.color]
    );
    console.log(`✓ Negocio: ${biz.name} (${biz.status})`);
  }

  await pool.end();
  console.log('\nSeed completo.');
}

seed().catch((err) => {
  console.error('Seed falló:', err.message);
  process.exit(1);
});
