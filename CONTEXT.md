# Superpanel — Contexto del Proyecto

## ⚙️ Flujo de trabajo (NORMA PERMANENTE)
- **Iván NUNCA revisa en local.** Siempre prueba en producción. No levantar dev/puertos ni pedir que abra `localhost`. Verificación local = solo `npm run build` + `node --check` (sintaxis/compilación).
- **Pushear SIEMPRE, sin pedir confirmación.** Al terminar cualquier cambio: `git add -A` + commit descriptivo + `git push` a `main`. Vercel despliega el frontend automáticamente; Railway el backend. Lo que valida Iván es el deploy en prod.
- **Actualizar este CONTEXT.md** en cada sesión con lo que se hizo.

## Qué es
App web interna (un solo usuario: Iván León) como torre de control de **León Ventures**. Centraliza finanzas y tracking personal. **Arquitectura:** León Ventures NO gestiona los negocios — solo LEE sus datos como espejo para tener gestión financiera global automática. Cada negocio se opera en su propio admin (`chaifit/superadmin`, `leoncoach/superadmin`). Aquí se sigue ingresando dinero manual de otras cosas, y se espejan los ingresos reales (Stripe) de los negocios conectados.

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
- **Etapa 2 ✅** — Sección Personal: todos, gym, box, recordatorios
- **Etapa 3 ✅** — Negocios: vista general consolidada, detalle por negocio, transacciones, MonthPicker
- **Etapa 4 ✅** — Polish + deploy: design system premium, componentes UI base, README, configs Railway/Vercel
- **Etapa 5 ✅** — Dashboard Home `/`: GET /dashboard (Promise.all), consolidado negocios, panel actividad (gym / box), tareas urgentes, recordatorios próximos/vencidos
- **Etapa 6 ✅** — Polish DetallaNegocio: history sparkline (BarChart 6 meses), sidebar dinámico desde DB, MRR semántico con `currentMrr` siempre del mes en curso
- **Etapa 7 ✅** — CRUD negocios: POST /negocios (nuevo endpoint, auto-slug), modal "Nuevo negocio" en VistaGeneral, modal "Editar negocio" (Settings) en DetallaNegocio, sidebar se refresca vía evento `negocios-updated`
- **Etapa 8 ⚠️ REVERTIDA** — Panel operativo León Coach (`LeonCoachPanel.jsx` + `routes/leoncoach.js`, 7 endpoints, 4 tabs). Eliminado en Etapa 9: ese funnel/cuestionarios/clientes se mueve a `leoncoach/superadmin`. Se conserva solo el pool `chaifit.js` (lo usa el espejo).
- **Etapa 13 ✅ (2026-06-12)** — **Tracker de hábitos (Gym/Box son hábitos) + nav de 4 tabs.** Gym y Box dejan de ser módulos sueltos: ahora son hábitos. Modelo: **check diario + meta semanal + racha de semanas**. Nuevas tablas `habits` (name, color, icon, weekly_goal, sort_order, archived) y `habit_checks` (UNIQUE habit_id+date). Backend `routes/habits.js`: GET / (con week_count, done_today, streak_weeks calculada en JS por semanas lunes), GET /:id/history, POST /, PATCH /:id, DELETE /:id, POST /:id/toggle (marca/desmarca hoy). `dashboard.js` cambia panel actividad (gym_week/box_week) por `habits` (week_count + done_today). **Eliminados:** tablas `gym_sessions`/`box_sessions` (DROP en prod) + sus endpoints + `Gym.jsx`/`Box.jsx`. Frontend: nueva `pages/habitos/index.jsx` (lista inset iOS: tile con inicial de color, barra de progreso semanal, racha 🔥, check circular para toggle hoy; modal crear/editar con selector de color y meta 1-7). Tab bar ahora 4: **Inicio · Negocios · Hábitos · Pendientes** (Recordatorios = subsección de Pendientes vía chips). Hábitos seed Gym(4x)/Box(3x) insertados en prod. **Fix bug latente:** el recoloreo de Etapa 10 había roto `text-zinc-500`→`text-ios-label0` (clase inexistente, `text-zinc-50` es prefijo); corregido a `text-ios-label2` en negocios + personal.
- **Etapa 12 ✅ (2026-06-12)** — **App móvil-nativa (patrón Chai Fit) + quitar Peso.** El producto es móvil-first (desktop no es prioridad). (1) **Peso eliminado** completo: endpoints `/personal/weight`, queries de peso en dashboard + objeto `weight` del response, `CREATE TABLE weight_log` en init.js, `Peso.jsx` borrado, ruta+chip+import; **`DROP TABLE weight_log`** en la BD de prod. Fila "Peso" quitada del panel Actividad del Dashboard. (2) **Phone-shell** (como Chai Fit): `Layout.jsx` ahora centra un shell `max-w-[440px]` a `100dvh` con `padding-top: env(safe-area-inset-top)`; `<main>` es el único scroll (`overscroll-contain`); `Sidebar.jsx` ELIMINADO (navegación solo por `BottomTabBar`, que ya no es overlay fijo sino parte del shell). (3) **CSS nativo** (`index.css`): `html,body overflow hidden + overscroll-behavior none` (sin rubber-band), `touch-action: pan-x pan-y`, `-webkit-user-select:none` + `tap-highlight transparent` + `touch-callout none` (con override en inputs/`.seleccionable`), scrollbar oculto. (4) **PWA instalable**: `public/manifest.json` (standalone, portrait, negro) + iconos `icon-192/512.png` y `apple-touch-icon.png` (generados con Python puro: "SP" blanco sobre azul iOS); `index.html` con `apple-mobile-web-app-capable`, status bar `black-translucent`, viewport `maximum-scale=1, user-scalable=no`. (5) `main.jsx` bloquea pinch-zoom (gesture*) y doble-tap-zoom de iOS. Build OK.
- **Etapa 11 ✅ (2026-06-12)** — **Fix login en móvil + estética de app de teléfono.** (1) **BUG resuelto:** en iPhone iniciabas sesión y te sacaba. Causa: auth por cookie cross-site (Vercel↔Railway) que Safari iOS bloquea (ITP/cookies de terceros). Fix: auth por **token JWT vía `Authorization: Bearer` + `localStorage`** (clave `sp_token`). Backend: `auth/login` devuelve `token`; `middleware/authenticate.js` expone `getToken(req)` que lee Bearer o cookie; `auth/me` lo usa. Frontend: `api.js` interceptor inyecta el Bearer y limpia el token en 401; `AuthContext` guarda/borra `sp_token`. Cookie se mantiene como respaldo en desktop. (2) **Responsive móvil:** `Sidebar` ahora `hidden md:flex`; nuevo `components/BottomTabBar.jsx` (tab bar inferior iOS con safe-area, tabs Inicio/Negocios/Personal, solo `md:hidden`); `Layout` con padding inferior para el tab bar; `personal/index.jsx` con sub-nav de chips (`md:hidden`) para moverse entre Pendientes/Gym/Box/Peso/Recordatorios sin sidebar. Build OK.
- **Etapa 10 ✅ (2026-06-12)** — **Eliminación de cannabis + rediseño iOS nativo (COMPLETO en toda la app).** Cannabis eliminado por completo: endpoints `/personal/cannabis`, query `cannabis_streak` del dashboard, ítem de sidebar, ruta, `Cannabis.jsx` borrado y **`DROP TABLE cannabis_log`** corrido en la BD de producción (Railway). Estética iOS: tokens globales (`tailwind.config.js` paleta `ios.*` con azul de sistema `#0A84FF`, system font SF Pro, radios `rounded-ios`/`rounded-ios-lg`, fondo `#000`), `index.css` + `index.html` sin Google Fonts. **Rediseñado TODO:** `Dashboard.jsx` (Large Title, balance hero, listas inset-grouped, iconos en cuadros redondeados, chevrons), `Sidebar.jsx` (item activo fill azul), `Login.jsx`, los 7 componentes UI base (`components/ui/`: Button/Input/Badge/Modal/Card/EmptyState/PageLoader → paleta iOS, manteniendo sus props), y las páginas Negocios (index + DetallaNegocio) y Personal (Pendientes/Gym/Box/Peso/Recordatorios) vía recoloreo sistemático a `ios.*` + headers Large Title (28px) + contenido centrado `max-w-2xl`. Gráficas recharts recoloreadas a hex iOS (#0A84FF/#30D158/#FF453A). Build OK.
- **Etapa 9 ✅ (2026-06-11)** — **León Ventures = espejo financiero global.** Se eliminó el panel operativo de León Coach (`routes/leoncoach.js`, `LeonCoachPanel.jsx`, su registro `/leon-coach` en `server/index.js`, import+render en `DetallaNegocio.jsx`). Nuevo `server/src/services/espejoChaifit.js`: lee ingresos reales en vivo de la BD de Chai Fit, solo lectura, tolerante a fallos (try/catch → si falla, sigue lo manual). `chai-fit` ← tabla `pagos` (`estado='completado'`, Stripe SaaS) + MRR de `suscripciones` activas. `leon-coach` ← `pagos_clientes` JOIN clientes (tenant LEON). Cableado en `negocios.js` (GET / y GET /:slug) y `dashboard.js`. Filas espejo: `origen:'espejo'`, badge "Auto" (Zap), no editables/borrables. Las transacciones manuales no cambian.

## Ideas para siguiente etapa (no comprometidas)
- **Notificaciones / alertas** — recordatorios vencidos con badge en sidebar, push notification o email
- **Exportar PDF/CSV** — transacciones del mes por negocio
- **Modo offline / PWA** — service worker básico para uso sin conexión

## Decisiones técnicas tomadas
- Acento indigo `#6366f1`, fondo `zinc-950`, sidebar `zinc-900`
- En dev: Vite proxy `/api` → servidor. En prod: `VITE_API_URL`
- `rejectUnauthorized: false` en conexión PG (Railway usa cert autofirmado — tradeoff aceptado, documentado aquí)
- Error genérico en login: no revela si el email existe o no
- Design system documentado en `/DESIGN_SYSTEM.md`
- Animaciones con framer-motion, variantes en `/client/src/lib/animations.js`
- Componentes UI base en `/client/src/components/ui/`: Button, Input, Badge, Modal, EmptyState, PageLoader, Card
- La app es un **phone-shell**: vive siempre como teléfono (`max-w-[440px]` centrado en desktop, full-screen en móvil). Navegación únicamente por `BottomTabBar` (Inicio/Negocios/Personal); NO hay sidebar (se eliminó). Enfoque del producto: **finanzas + hábitos + pendientes**.
- CORS: `CLIENT_URL` soporta múltiples origins separados por coma
- En Login y cualquier catch de API: usar `typeof msg === 'string' ? msg : 'fallback'` — las 404 de Vercel devuelven `{error: {code, message}}` (objeto) no string
- **Conexión dual de BD:** `server/src/db/index.js` → Superpanel DB (principal). `server/src/db/chaifit.js` → BD de Chai Fit (Railway, pool max 5, usado por el espejo `espejoChaifit.js`). Ambas usan `rejectUnauthorized: false` en producción.
- **Espejo de ingresos (`services/espejoChaifit.js`):** solo lectura, tolerante a fallos. Negocios espejados: `chai-fit` (tabla `pagos`, MRR de `suscripciones`) y `leon-coach` (`pagos_clientes` tenant LEON). ✅ VERIFICADO (2026-06-12) contra la BD real de Chai Fit: `pagos.creado_en` existe (timestamptz default now()), los 3 queries corren sin error de esquema. Hoy sale $0 por falta de datos reales (no por bug).
- **Slugs hardcodeados:** `'chai-fit'` y `'leon-coach'` en seed.js — valores exactos para condicionales del espejo, no derivarlos del nombre.

## Variables de entorno Railway (superpanel-api)
```
CLIENT_URL=https://superpanel-eight.vercel.app,https://superpanel.vercel.app
NODE_ENV=production
DATABASE_URL=<postgres railway internal>
JWT_SECRET=<secreto>
CHAIFIT_DATABASE_URL=<postgres railway de Chai Fit>   # usado por el espejo de ingresos
```
> Las `LC_PRICE_*` quedaron obsoletas en Etapa 9 (el endpoint `/leon-coach/planes` se eliminó). Se pueden borrar de Railway.

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
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Login.jsx
│   │       ├── Personal/
│   │       └── negocios/
│   │           ├── index.jsx        # VistaGeneral
│   │           └── DetallaNegocio.jsx
│   └── vercel.json          # SPA rewrite + security headers
├── server/          # Express
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.js     # pool principal (Superpanel DB)
│   │   │   ├── init.js
│   │   │   └── chaifit.js   # pool secundario (Chai Fit DB via CHAIFIT_DATABASE_URL)
│   │   ├── services/
│   │   │   └── espejoChaifit.js  # espejo de ingresos solo-lectura (chai-fit / leon-coach)
│   │   └── routes/          # auth, personal, negocios, dashboard
│   ├── index.js
│   └── railway.json
├── DESIGN_SYSTEM.md
└── CONTEXT.md       # este archivo
```

## Historial de cambios relevantes
| Fecha | Cambio |
|---|---|
| 2026-06-11 | Etapa 9: León Ventures = espejo financiero. Eliminado panel operativo León Coach; nuevo services/espejoChaifit.js (ingresos reales de chai-fit `pagos` + leon-coach `pagos_clientes`), cableado en negocios.js y dashboard.js, filas espejo no editables |
| 2026-06-05 | Etapa 8: Panel León Coach integrado — LeonCoachPanel.jsx (4 tabs), pool chaifit.js, 7 endpoints /leon-coach/*, fix IDOR tenant_id en revisar (REVERTIDO en Etapa 9) |
| 2026-06-04 | Etapa 7: CRUD negocios — POST /negocios, modal crear en VistaGeneral, modal editar en DetallaNegocio, sidebar refresca vía evento |
| 2026-06-04 | History sparkline: BarChart recharts en DetallaNegocio; `history` ya venía del backend |
| 2026-06-04 | Sidebar dinámico: negocios cargados de GET /negocios en montaje, sin hardcodeo |
| 2026-06-04 | MRR semántico: backend agrega `currentMrr` (CURRENT_DATE); badge "hoy" en meses históricos |
| 2026-06-04 | Fix deploy: VITE_API_URL en Vercel; railway up debe correr desde server/ |
| 2026-06-04 | Fix React #31: typeof guard en setError (Login + Dashboard); ErrorState defensivo |
| 2026-06-04 | Etapa 5: Dashboard Home `/` — GET /dashboard + Dashboard.jsx, redirect login → / |
| 2026-06-03 | Etapa 4 completa: design system premium, deploy Railway + Vercel |
| 2026-06-03 | Fix CORS: multi-origin en server/index.js, CLIENT_URL actualizado en Railway |

---
_Actualizar este archivo cada vez que se complete una etapa o se tome una decisión técnica relevante._
