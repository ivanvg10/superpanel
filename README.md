# Superpanel

Torre de control privada de León Ventures. Un solo login protege todo.

---

## Stack

| Capa        | Tecnología                                       |
|-------------|--------------------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS + Framer Motion  |
| Backend     | Node.js + Express                               |
| Base de datos | PostgreSQL                                    |
| Auth        | JWT firmado, almacenado en cookie httpOnly      |
| Deploy      | Railway (server + DB) · Vercel (client)         |

---

## Estructura del monorepo

```
superpanel/
├── client/          React + Vite — se deploya en Vercel
│   └── src/
│       ├── components/ui/   Button, Input, Badge, Modal, EmptyState…
│       ├── contexts/        AuthContext
│       ├── lib/             api.js (axios), animations.js (framer-motion)
│       └── pages/
│           ├── Login.jsx
│           ├── negocios/    Vista general + detalle por negocio
│           └── personal/    Pendientes, Gym, Box, Recordatorios
│
├── server/          Node + Express — se deploya en Railway
│   └── src/
│       ├── db/              Pool de pg + init/migraciones
│       ├── routes/          auth.js · personal.js · negocios.js
│       └── middleware/      authenticate.js (JWT)
│
├── DESIGN_SYSTEM.md  Tokens de diseño, paleta, tipografía, componentes
├── env.example       Plantilla de variables de entorno
└── package.json      Workspace root (npm workspaces)
```

---

## Setup local

### Requisitos

- Node.js ≥ 18
- npm ≥ 9
- PostgreSQL ≥ 14 corriendo localmente

### 1 · Instalar dependencias

```bash
cd superpanel
npm install           # instala raíz + ambos workspaces automáticamente
```

### 2 · Crear base de datos local

```bash
psql -U postgres -c "CREATE DATABASE superpanel;"
```

### 3 · Variables de entorno del servidor

```bash
cp env.example server/.env
```

Abre `server/.env` y ajusta estos valores mínimos:

```
JWT_SECRET=   # genera uno con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
DATABASE_URL= # postgresql://tu_usuario:tu_contraseña@localhost:5432/superpanel
ADMIN_EMAIL=  # tu email
ADMIN_PASSWORD= # tu contraseña segura
```

### 4 · Seed — crear usuario e insertar negocios

```bash
npm run seed
```

Salida esperada:
```
DB: tablas listas
✓ Usuario: ivan@leonventures.com
✓ Negocio: Chai Fit (live)
✓ Negocio: León Coach (live)
✓ Negocio: San Charly MX (construccion)

Seed completo.
```

> El seed es idempotente: puedes volver a correrlo sin problemas.

### 5 · Correr en desarrollo

```bash
npm run dev
```

| Servicio  | URL                     |
|-----------|-------------------------|
| Frontend  | http://localhost:5173   |
| Backend   | http://localhost:3001   |
| Healthcheck | http://localhost:3001/health |

El frontend proxea `/api/*` → `localhost:3001` automáticamente via Vite.

---

## Deploy en producción

### Railway · Servidor + Base de datos

**Prerrequisito:** cuenta en [railway.app](https://railway.app).

#### Opción A — Deploy desde GitHub (recomendado)

1. En Railway: **New Project → Deploy from GitHub repo**
2. Selecciona el repositorio
3. Railway detecta Node.js automáticamente; configura el **Root Directory** como `server`
4. Añade el plugin **PostgreSQL**:  
   Railway inyecta `DATABASE_URL` automáticamente al añadirlo
5. Configura las **variables de entorno** del servicio server:

   | Variable       | Valor                                    |
   |----------------|------------------------------------------|
   | `NODE_ENV`     | `production`                             |
   | `JWT_SECRET`   | cadena aleatoria de 64+ caracteres       |
   | `CLIENT_URL`   | `https://tu-proyecto.vercel.app`         |
   | `ADMIN_EMAIL`  | tu email                                 |
   | `ADMIN_PASSWORD` | contraseña segura                      |

6. Railway despliega con `node index.js` (definido en `railway.json`)

#### Correr el seed en Railway (primer deploy)

```bash
# Instala Railway CLI si no lo tienes
npm install -g @railway/cli

# Autentícate
railway login

# Corre el seed en el servicio del servidor
railway run --service=server npm run seed
```

O desde el dashboard de Railway: **Service → Settings → Deploy → New Deploy with custom command → `npm run seed`**

---

### Vercel · Frontend

**Prerrequisito:** cuenta en [vercel.com](https://vercel.com).

1. En Vercel: **Add New Project → Import Git Repository**
2. Configura:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (auto-detectado)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Añade la **variable de entorno**:

   | Variable       | Valor                                              |
   |----------------|-----------------------------------------------------|
   | `VITE_API_URL` | `https://tu-servidor.railway.app` (sin trailing /) |

4. **Deploy**

> El `vercel.json` ya incluye el rewrite para SPA (`/* → /index.html`) y headers de seguridad básicos.

---

## Variables de entorno — referencia completa

### Servidor (`server/.env`)

| Variable         | Descripción                          | Requerida | Ejemplo                            |
|------------------|--------------------------------------|-----------|------------------------------------|
| `PORT`           | Puerto del servidor                  | No        | `3001`                             |
| `NODE_ENV`       | Entorno de ejecución                 | Sí (prod) | `production`                       |
| `JWT_SECRET`     | Secreto para firmar tokens JWT       | **Sí**    | string aleatorio de 64+ chars      |
| `DATABASE_URL`   | URI de conexión a PostgreSQL         | **Sí**    | `postgresql://u:p@host:5432/db`    |
| `CLIENT_URL`     | URL del frontend (para CORS)         | Sí        | `https://superpanel.vercel.app`    |
| `ADMIN_EMAIL`    | Email del usuario inicial            | Para seed | `ivan@leonventures.com`            |
| `ADMIN_PASSWORD` | Contraseña del usuario inicial       | Para seed | contraseña segura                  |

### Frontend (variables de entorno Vercel / local)

| Variable        | Descripción                      | Dev         | Producción                         |
|-----------------|----------------------------------|-------------|-------------------------------------|
| `VITE_API_URL`  | URL base del servidor            | *(vacío)*   | `https://tu-servidor.railway.app`  |

> En desarrollo no es necesaria: Vite proxea `/api` al servidor local automáticamente.

---

## Primer acceso

```
URL:        http://localhost:5173 (dev)  /  https://tu-proyecto.vercel.app (prod)
Email:      el ADMIN_EMAIL configurado en el seed
Contraseña: el ADMIN_PASSWORD configurado en el seed
```

---

## Comandos útiles

```bash
# Desarrollo completo (client + server en paralelo)
npm run dev

# Solo seed (crear/actualizar usuario y negocios)
npm run seed

# Build del cliente para producción
npm run build

# Health check del servidor
curl http://localhost:3001/health
```

---

## Módulos implementados

| Sección  | Módulo            | Descripción                                          |
|----------|-------------------|------------------------------------------------------|
| Negocios | Vista General     | Consolidado MRR + ingresos + gastos de todos los negocios |
| Negocios | Chai Fit          | Detalle, transacciones por mes, tareas pendientes    |
| Negocios | León Coach        | Ídem                                                 |
| Negocios | San Charly MX     | Ídem                                                 |
| Personal | Pendientes        | CRUD de tareas, filtro por proyecto, agrupadas por prioridad |
| Personal | Gym               | Registro de sesiones con stats semanales/mensuales   |
| Personal | Box               | Ídem + campo de rounds                               |
| Personal | Recordatorios     | Con fecha/hora, toggle completado, vencidos resaltados |
