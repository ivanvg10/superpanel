# Superpanel — Contexto del Proyecto

## Qué es
App web interna (un solo usuario: Iván León) como torre de control de León Ventures. Centraliza finanzas, operaciones y tracking personal de todos los negocios y vida personal.

## URLs de producción
| Servicio | URL |
|---|---|
| Frontend | https://superpanel-eight.vercel.app |
| Backend | https://superpanel-api-production-e1a2.up.railway.app |
| Login | ivan@leonventures.com / Ivan2026! |

## Stack
- **Client:** React + Vite + Tailwind + framer-motion + recharts
- **Server:** Node + Express + PostgreSQL
- **Auth:** JWT httpOnly cookie
- **Deploy:** Vercel (frontend) + Railway (backend + DB)
- **Repo local:** /Users/ivan/superpanel

## Railway — importante
Hay 4 proyectos con nombres similares en la cuenta. El real es **"superpanel-server"**.
- Para vincularlo: `railway link --project "superpanel-server"` → production → superpanel-api
- PROJECT_ID: `dac0f13c-92f9-4b6b-9593-58ec8b64fc8a`
- El proyecto llamado solo "superpanel" (sin sufijo) tiene dominio distinto y NO es el de producción.

## Estado de etapas
- **Etapa 1 ✅** — Monorepo, auth JWT, login, ProtectedRoute, Sidebar con todas las secciones
- **Etapa 2 ✅** — Sección Personal: todos, gym, box, peso (recharts), cannabis (streak), recordatorios
- **Etapa 3 ✅** — Negocios: vista general consolidada, detalle por negocio, transacciones, MonthPicker
- **Etapa 4 ✅** — Polish + deploy: design system premium, componentes UI base, README, configs Railway/Vercel

## Decisiones técnicas tomadas
- Acento indigo `#6366f1`, fondo `zinc-950`, sidebar `zinc-900`
- En dev: Vite proxy `/api` → servidor. En prod: `VITE_API_URL`
- `rejectUnauthorized: false` en conexión PG (Railway usa cert autofirmado — tradeoff aceptado)
- Error genérico en login: no revela si el email existe o no
- Design system documentado en `/DESIGN_SYSTEM.md`
- Animaciones con framer-motion, variantes en `/client/src/lib/animations.js`
- Componentes UI base en `/client/src/components/ui/`: Button, Input, Badge, Modal, EmptyState, PageLoader, Card
- `cannabis_log` y `weight_log` tienen `UNIQUE(user_id, date)` → `ON CONFLICT DO UPDATE`
- CORS: `CLIENT_URL` soporta múltiples origins separados por coma

## Variables de entorno Railway (superpanel-api)
```
CLIENT_URL=https://superpanel-eight.vercel.app,https://superpanel.vercel.app
NODE_ENV=production
DATABASE_URL=<postgres railway internal>
JWT_SECRET=<secreto>
```

## Estructura del repo
```
superpanel/
├── client/          # React + Vite
│   ├── src/
│   │   ├── components/ui/   # Button, Input, Badge, Modal, EmptyState, PageLoader, Card
│   │   ├── lib/animations.js
│   │   └── pages/           # Login, Personal, Negocios, ...
│   └── vercel.json          # SPA rewrite + security headers
├── server/          # Express
│   ├── src/
│   │   ├── db/init.js
│   │   └── routes/          # auth, personal, negocios
│   ├── index.js
│   └── railway.json
├── DESIGN_SYSTEM.md
└── CONTEXT.md       # este archivo
```

## Historial de cambios relevantes
| Fecha | Cambio |
|---|---|
| 2026-06-03 | Etapa 4 completa: design system premium, deploy Railway + Vercel |
| 2026-06-03 | Fix CORS: multi-origin en server/index.js, CLIENT_URL actualizado en Railway |

---
_Actualizar este archivo cada vez que se complete una etapa o se tome una decisión técnica relevante._
