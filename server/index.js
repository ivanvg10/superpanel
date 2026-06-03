require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const initDB = require('./src/db/init');
const authRoutes      = require('./src/routes/auth');
const personalRoutes  = require('./src/routes/personal');
const negociosRoutes  = require('./src/routes/negocios');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use('/auth',      authRoutes);
app.use('/personal',  personalRoutes);
app.use('/negocios',  negociosRoutes);

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date() }));

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Superpanel server → http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error iniciando DB:', err.message);
    process.exit(1);
  });
