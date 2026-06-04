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
- **Deploy:** Vercel (frontend, CI/CD desde GitHub main) + Railway (backend + DB)
- **Repo local:** /Users/ivan/superpanel
- **GitHub:** https://github.com/ivanvg10/superpanel

## Railway — importante
Hay proyectos con nombres similares en la cuenta. El real es **"superpanel-server"**.
- Para vincularlo: `railway link --project "superpanel-server"` → production → superpanel-api
- PROJECT_ID: `dac0f13c-92f9-4b6b-9593-58ec8b64fc8a`
- SERVICE_ID: `c366532a-56f2-4704-a5cf-32a298fabd04`
- **Deploy manual del backend:** siempre desde `server/` → `cd server && railway up`
  (si se corre desde la raíz del monorepo, Railway sube el código incorrecto)

## Vercel — importante
- CI/CD conectado a GitHub — push a `main` despliega automáticamente el frontend
- **Variable de entorno requerida (ya configurada):**
  `VITE_API_URL=https://superpanel-api-production-e1a2.up.railway.app`
- Si falta esta variable, el frontend llama a `/api/...` en Vercel (404) en lugar de Railway

## Estado de etapas
- **Etapa 1 ✅** — Monorepo, auth JWT, login, ProtectedRoute, Sidebar con todas las secciones
- **Etapa 2 ✅** — Sección Personal: todos, gym, box, peso (recharts), cannabis (streak), recordatorios
- **Etapa 3 ✅** — Negocios: vista general consolidada, detalle por negocio, transacciones, MonthPicker
- **Etapa 4 ✅** — Polish + deploy: design system premium, componentes UI base, README, configs Railway/Vercel
- **Etapa 5 ✅** — Dashboard Home `/`: GET /dashboard (Promise.all 8 queries), consolidado negocios, panel fitness (cannabis streak / gym / box / peso+delta), tareas urgentes, recordatorios próximos/vencidos

## Gaps conocidos (siguiente etapa natural)
- **History sparkline en DetallaNegocio:** el backend ya devuelve `history` (últimos 6 meses) pero el frontend lo ignora — zero trabajo de API, solo renderizar un recharts BarChart/AreaChart
- **Sidebar dinámico:** los 3 negocios están hardcodeados como NavLinks; si cambian en DB el sidebar no se actualiza
- **MRR semántico:** en DetallaNegocio, el MRR se calcula del mes seleccionado (no del mes actual); en meses históricos muestra el MRR de ese mes, no el actual

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
- En Login y cualquier catch de API: usar `typeof msg === 'string' ? msg : 'fallback'` — las 404 de Vercel devuelven `{error: {code, message}}` (objeto) no string

## Variables de entorno Railway (superpanel-api)
```
CLIENT_URL=https://superpanel-eight.vercel.app,https://superpanel.vercel.app
NODE_ENV=production
DATABASE_URL=<postgres railway internal>
JWT_SECRET=<secreto>
```

## Variables de entorno Vercel (superpanel frontend)
```
VITE_API_URL=https://superpanel-api-production-e1a2.up.railway.app
```

## Estructura del repo
```
superpanel/
├── client/          # React + Vite
│   ├── src/
│   │   ├── components/ui/   # Button, Input, Badge, Modal, EmptyState, PageLoader, Card
│   │   ├── lib/animations.js
│   │   └── pages/           # Dashboard, Login, Personal/, Negocios/
│   └── vercel.json          # SPA rewrite + security headers
├── server/          # Express
│   ├── src/
│   │   ├── db/init.js
│   │   └── routes/          # auth, personal, negocios, dashboard
│   ├── index.js
│   └── railway.json
├── DESIGN_SYSTEM.md
└── CONTEXT.md       # este archivo
```

## Historial de cambios relevantes
| Fecha | Cambio |
|---|---|
| 2026-06-04 | Fix deploy: VITE_API_URL en Vercel; railway up debe correr desde server/ |
| 2026-06-04 | Fix React #31: typeof guard en setError (Login + Dashboard); ErrorState defensivo |
| 2026-06-04 | Etapa 5: Dashboard Home `/` — GET /dashboard + Dashboard.jsx, redirect login → / |
| 2026-06-03 | Etapa 4 completa: design system premium, deploy Railway + Vercel |
| 2026-06-03 | Fix CORS: multi-origin en server/index.js, CLIENT_URL actualizado en Railway |

---
_Actualizar este archivo cada vez que se complete una etapa o se tome una decisión técnica relevante._
