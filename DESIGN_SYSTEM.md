# Superpanel — Design System

> Estética objetivo: **Whoop meets Strava meets premium SaaS dashboard.**
> Dark-first, data-forward, microinteractions que se sienten físicas.
> Chai Fit aporta la energía — emerald como señal de vida.

---

## Tipografía

### Fuentes (Google Fonts — ya cargadas en index.html)
| Rol       | Familia              | Pesos       | Uso                              |
|-----------|----------------------|-------------|----------------------------------|
| Display   | Plus Jakarta Sans    | 600/700/800 | Títulos de página, display text  |
| Body      | Inter                | 400/500/600 | Texto general, labels, UI        |
| Mono      | JetBrains Mono       | 400/500     | Números, datos, cifras           |

Clase Tailwind: `font-display`, `font-body`, `font-mono`

### Escala tipográfica
| Token   | Size  | Line-height | Weight | Uso                     |
|---------|-------|-------------|--------|-------------------------|
| display | 36px  | 1.1         | 800    | Títulos grandes          |
| h1      | 24px  | 1.2         | 700    | Títulos de sección       |
| h2      | 20px  | 1.3         | 700    | Subtítulos               |
| h3      | 16px  | 1.4         | 600    | Card headers             |
| body    | 14px  | 1.6         | 400    | Texto corriente          |
| sm      | 13px  | 1.5         | 400    | Labels, metadata         |
| xs      | 11px  | 1.4         | 500    | Chips, badges, caps      |

---

## Paleta de Colores

### Principio de color
El superpanel es **zinc-950 de base**. El acento es **indigo** para interacción y **emerald** para vida/estado activo (herencia directa de Chai Fit `#22C55E`). Otros proyectos tienen su propio acento semántico.

### Fondos y superficies
| Token          | Valor     | Clase Tailwind | Uso                          |
|----------------|-----------|----------------|------------------------------|
| bg-base        | #09090B   | zinc-950       | Fondo de la aplicación       |
| bg-surface     | #18181B   | zinc-900       | Cards, sidebar, modals       |
| bg-elevated    | #27272A   | zinc-800       | Inputs, hover states         |
| bg-hover       | #3F3F46   | zinc-700       | Estados de hover activos     |
| bg-overlay     | #09090B/80 | zinc-950/80   | Backdrops de modal           |

### Texto
| Token       | Valor   | Clase Tailwind | Uso                          |
|-------------|---------|----------------|------------------------------|
| text-1      | #FAFAFA | zinc-50        | Títulos, texto principal     |
| text-2      | #D4D4D8 | zinc-300       | Texto secundario             |
| text-3      | #A1A1AA | zinc-400       | Labels, descripciones        |
| text-muted  | #71717A | zinc-500       | Placeholders, metadata       |
| text-ghost  | #52525B | zinc-600       | Texto muy secundario         |

### Bordes
| Token          | Valor   | Clase Tailwind |
|----------------|---------|----------------|
| border-subtle  | #27272A | zinc-800       |
| border-default | #3F3F46 | zinc-700       |
| border-strong  | #52525B | zinc-600       |

### Colores semánticos
| Token    | Hex     | Tailwind   | Uso                              |
|----------|---------|------------|----------------------------------|
| accent   | #6366F1 | indigo-500 | CTAs, foco, nav activo           |
| success  | #10B981 | emerald-500| Live, confirmaciones, Chai Fit   |
| warning  | #F59E0B | amber-500  | Advertencias, beta, San Charly   |
| error    | #EF4444 | red-500    | Errores, urgente                 |
| info     | #3B82F6 | blue-500   | León Coach, información neutral  |

### Badges de proyecto/negocio
| Proyecto    | Background          | Text           | Border               |
|-------------|---------------------|----------------|----------------------|
| chai-fit    | emerald-500/10      | emerald-400    | emerald-500/20       |
| leon-coach  | blue-500/10         | blue-400        | blue-500/20         |
| san-charly  | amber-500/10        | amber-400      | amber-500/20         |
| personal    | violet-500/10       | violet-400     | violet-500/20        |

---

## Sombras (custom Tailwind tokens)

```
shadow-card         → 0 1px 1px rgba(0,0,0,.3), 0 2px 8px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.04)
shadow-card-hover   → 0 2px 4px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.06)
shadow-modal        → 0 24px 80px rgba(0,0,0,.8), 0 8px 32px rgba(0,0,0,.4)
shadow-glow         → 0 0 20px rgba(99,102,241,.35), 0 0 40px rgba(99,102,241,.15)
shadow-glow-sm      → 0 0 10px rgba(99,102,241,.25)
shadow-popover      → 0 8px 32px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.3)
```

---

## Border Radius
| Token | Valor   | Clase Tailwind | Uso                         |
|-------|---------|----------------|-----------------------------|
| sm    | 6px     | rounded        | Chips, tags pequeños        |
| md    | 8px     | rounded-md     | Botones secundarios         |
| lg    | 12px    | rounded-xl     | Cards (default)             |
| xl    | 16px    | rounded-2xl    | Modals, panels grandes      |
| pill  | 9999px  | rounded-full   | Badges, live dot, avatar    |

---

## Escala de Spacing (base 4px)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96`

| Contexto                    | Valor Tailwind     |
|-----------------------------|--------------------|
| Padding interno de card     | `p-5` (20px)       |
| Gap entre secciones         | `space-y-6` (24px) |
| Padding de página           | `px-8 py-7`        |
| Padding de page header      | `px-8 py-6`        |
| Gap entre cards (grid)      | `gap-4` (16px)     |

---

## Componentes Base

### Card
```jsx
// components/ui/Card.jsx
<div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-card
  hover:border-zinc-700 hover:shadow-card-hover transition-all duration-200">
```

Variante `flat` (sin hover, para contenedores internos):
```jsx
className="bg-zinc-800/50 rounded-xl border border-zinc-800"
```

### StatCard
Métrica de una sola cifra. Siempre `font-mono` para el número.
```jsx
<div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
  <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
  <p className="font-display text-2xl font-bold text-zinc-200 font-mono">{value}</p>
  <p className="text-xs text-zinc-600 mt-1">{sub}</p>  {/* optional */}
</div>
```

### Button — Variantes
| Variante    | Base                                        | Hover                  |
|-------------|---------------------------------------------|------------------------|
| primary     | bg-indigo-600 text-white shadow-glow-sm     | bg-indigo-500 shadow-glow |
| secondary   | bg-zinc-800 text-zinc-200 border-zinc-700   | bg-zinc-700 border-zinc-600 |
| ghost       | text-zinc-400                               | text-zinc-100 bg-zinc-800/70 |
| destructive | bg-red-500/10 text-red-400 border-red-500/20| bg-red-500/20 border-red-500/40 |

Todos los botones: `rounded-xl font-medium transition-all duration-150 active:scale-[0.97]`

### Input
```
bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600
focus: ring-2 ring-indigo-500/40 border-indigo-500/60 outline-none
error: border-red-500/60 ring-red-500/30
```
Label: `text-xs font-medium text-zinc-400 uppercase tracking-wide`

### Badge
```
inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border
```

### Nav Item — estados
| Estado  | Clases                                                     |
|---------|------------------------------------------------------------|
| default | `text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 border-transparent` |
| active  | `bg-indigo-500/10 text-indigo-300 border-indigo-500/20`    |

---

## Status Indicators

### Live Dot (pulsante — para negocios "live")
```jsx
<span className="relative flex h-2 w-2">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
</span>
```

### Status Badge
```
live:         bg-emerald-500/10 text-emerald-400 border-emerald-500/20
beta:         bg-blue-500/10    text-blue-400    border-blue-500/20
construccion: bg-amber-500/10   text-amber-400   border-amber-500/20
```

---

## Gradientes — Elementos decorativos

Usar con moderación. Solo como hints de profundidad, no como fondos prominentes.

### Page bg glow (Login, páginas de entrada)
```css
/* Un solo radial centrado, muy sutil */
.absolute.inset-0 > div {
  background: radial-gradient(ellipse at 50% 40%, rgba(99,102,241,0.06) 0%, transparent 60%);
}
/* Tailwind: bg-indigo-600/5 blur-3xl rounded-full w-[600px] h-[400px] */
```

### Card accent line (opcional para cards de proyectos live)
```css
border-top: 2px solid rgba(16, 185, 129, 0.3);  /* emerald para chai-fit */
```

---

## Motion — Variantes Framer Motion

Todas definidas en `src/lib/animations.js`. Importar desde ahí.

### fadeUp (entrada de página y elementos)
```js
initial: { opacity: 0, y: 12 }
animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }
exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } }
```

### stagger (listas de cards)
```js
// Parent: variants={staggerContainer} initial="initial" animate="animate"
container: { animate: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } } }
// Child: variants={staggerItem}
item:       { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }
```

### modalEnter
```js
initial: { opacity: 0, scale: 0.96, y: 10 }
animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }
exit:    { opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } }
```

### backdropEnter
```js
initial: { opacity: 0 }
animate: { opacity: 1, transition: { duration: 0.2 } }
exit:    { opacity: 0, transition: { duration: 0.18 } }
```

---

## States — Diseñados, nunca texto plano

### Empty State
```jsx
// components/ui/EmptyState.jsx — siempre usar este componente
<EmptyState
  icon={LucideIcon}
  title="Título descriptivo"
  description="Frase corta explicando el por qué y qué sigue."
  action={<Button variant="secondary">CTA</Button>}  {/* opcional */}
/>
```

### Loading State (Skeleton)
```
Shimmer: bg-gradient-to-r from-zinc-800 via-zinc-700/60 to-zinc-800
animate-shimmer (keyframe definido en tailwind.config.js)
```
Usar `PageLoader` de `components/ui/PageLoader.jsx`.

### Error State
```
bg-red-950/30 border border-red-900/40 rounded-xl p-5
Ícono circular rojo + mensaje + botón "Reintentar"
```
Usar `ErrorState` de `components/ui/PageLoader.jsx`.

---

## Aesthetic Direction — Fitness Premium

**Referentes**: Whoop app (dark, data-forward, minimal chrome) + Strava (activity energy, metric cards) + Linear (smooth interactions, excellent typography).

**Principios para este proyecto:**
1. **Data primero** — los números son el contenido principal. `font-mono` para todas las métricas.
2. **Chrome mínimo** — no decoración sin propósito. Cada borde existe por estructura, no por ornamento.
3. **Color como señal** — emerald = vida/activo, indigo = acción, amber = atención, rojo = urgencia.
4. **Motion funcional** — las animaciones orientan, no entretienen. Fade-up en páginas, stagger en listas, tap scale en botones.
5. **Densidad apropiada** — panel de operaciones, no landing page. La información es densa pero respira.

---

## Reglas rápidas (anti-patterns)
- No `text-white` en párrafos — usar `text-zinc-300` o `text-zinc-400`
- No `rounded-lg` en cards — usar `rounded-xl`
- No `border-gray-*` — todo borde es `border-zinc-*`
- No emoji como estado vacío — usar `<EmptyState icon={Icon}>`
- No inputs crudos en formularios — usar `<Input>` del design system
- No `gap-6` en grids de cards — usar `gap-4`
- No `text-sm` en labels de input — usar `text-xs uppercase tracking-wide`
