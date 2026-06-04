import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Leaf, Dumbbell, Weight, TrendingUp, TrendingDown, Minus,
  CheckSquare, Bell, ArrowUpRight, Circle, AlertCircle,
  Activity,
} from 'lucide-react';
import api from '../lib/api';
import PageLoader, { ErrorState } from '../components/ui/PageLoader';
import { PriorityDot, ProjectBadge } from '../components/ui/Badge';
import { fadeUp, staggerContainer, staggerItem } from '../lib/animations';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmx(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function todayLabel() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatReminderDate(str) {
  if (!str) return null;
  const d = new Date(str);
  const now = new Date();
  const isPast = d < now;
  return {
    label: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    isPast,
  };
}

// ─── Átomos ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function StatCard({ label, value, sub, highlight, trend }) {
  return (
    <div className={`rounded-xl p-4 border ${
      highlight
        ? 'bg-indigo-600/10 border-indigo-500/20'
        : 'bg-zinc-900 border-zinc-800'
    }`}>
      <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`font-mono text-xl font-bold leading-none ${highlight ? 'text-indigo-300' : 'text-zinc-100'}`}>
        {value}
      </p>
      {(sub || trend !== undefined) && (
        <div className="flex items-center gap-1 mt-2">
          {trend !== undefined && trend !== null && trend !== 0 && (
            trend > 0
              ? <TrendingUp className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              : <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
          )}
          {sub && <p className="text-xs text-zinc-600">{sub}</p>}
        </div>
      )}
    </div>
  );
}

const COLOR_CFG = {
  emerald: { icon: 'text-emerald-400', ring: 'bg-emerald-500/10 border-emerald-500/20' },
  blue:    { icon: 'text-blue-400',    ring: 'bg-blue-500/10    border-blue-500/20'    },
  amber:   { icon: 'text-amber-400',   ring: 'bg-amber-500/10   border-amber-500/20'  },
};

const STATUS_CFG = {
  live:         { label: 'Live',    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  beta:         { label: 'Beta',    cls: 'bg-blue-500/10    text-blue-400    border-blue-500/20'    },
  construccion: { label: 'Pronto',  cls: 'bg-amber-500/10   text-amber-400   border-amber-500/20'  },
};

function BusinessCard({ b }) {
  const col = COLOR_CFG[b.color] || COLOR_CFG.blue;
  const st  = STATUS_CFG[b.status] || STATUS_CFG.construccion;
  const net = Number(b.income_month) - Number(b.expenses_month);

  return (
    <motion.div variants={staggerItem}>
      <Link
        to={`/negocios/${b.slug}`}
        className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 hover:shadow-card-hover transition-all duration-200 group"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${col.ring}`}>
              <TrendingUp className={`w-3.5 h-3.5 ${col.icon}`} />
            </div>
            <span className="text-sm font-semibold text-zinc-100">{b.name}</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${st.cls}`}>
            {st.label}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-xs text-zinc-600">MRR</span>
            <span className="font-mono text-xs text-indigo-300">
              {Number(b.mrr) > 0 ? fmx(b.mrr) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-zinc-600">Neto mes</span>
            <span className={`font-mono text-xs font-semibold ${
              net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : 'text-zinc-500'
            }`}>
              {Number(b.income_month) > 0 || Number(b.expenses_month) > 0 ? fmx(net) : '—'}
            </span>
          </div>
          {Number(b.pending_todos) > 0 && (
            <div className="flex justify-between">
              <span className="text-xs text-zinc-600">Tareas</span>
              <span className="text-xs text-zinc-400">{b.pending_todos} pendientes</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Panel fitness (izquierda) ────────────────────────────────────────────────

function FitnessRow({ icon: Icon, label, value, sub, valueColor = 'text-zinc-100' }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <div className="text-right">
        <span className={`font-mono text-sm font-semibold ${valueColor}`}>{value}</span>
        {sub && <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function FitnessPanel({ data }) {
  const streak = data.cannabis_streak;
  const w      = data.weight;

  const streakColor = streak === null ? 'text-zinc-500'
    : streak === 0 ? 'text-red-400'
    : streak < 7   ? 'text-yellow-400'
    : 'text-emerald-400';

  const streakValue = streak === null ? '—'
    : streak === 0 ? 'Hoy'
    : `${streak}d`;

  const weightValue = w ? `${w.kg} kg` : '—';
  const weightSub   = w?.delta_7d != null
    ? `${w.delta_7d > 0 ? '+' : ''}${w.delta_7d} kg esta semana`
    : 'sin comparativa';
  const weightColor = !w ? 'text-zinc-500'
    : w.delta_7d == null ? 'text-zinc-100'
    : w.delta_7d <= 0 ? 'text-emerald-400'
    : 'text-amber-400';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 shadow-card">
      <SectionLabel>Fitness & Bienestar</SectionLabel>
      <FitnessRow
        icon={Leaf}
        label="Cannabis"
        value={streakValue}
        sub={streak === null ? 'sin registros' : streak === 0 ? 'consumido hoy' : 'sin consumo'}
        valueColor={streakColor}
      />
      <FitnessRow
        icon={Dumbbell}
        label="Gym esta semana"
        value={data.gym_week > 0 ? `${data.gym_week} sesión${data.gym_week !== 1 ? 'es' : ''}` : 'Ninguna'}
        valueColor={data.gym_week > 0 ? 'text-zinc-100' : 'text-zinc-500'}
      />
      <FitnessRow
        icon={Dumbbell}
        label="Box esta semana"
        value={data.box_week > 0 ? `${data.box_week} sesión${data.box_week !== 1 ? 'es' : ''}` : 'Ninguna'}
        valueColor={data.box_week > 0 ? 'text-zinc-100' : 'text-zinc-500'}
      />
      <FitnessRow
        icon={Weight}
        label="Peso"
        value={weightValue}
        sub={weightSub}
        valueColor={weightColor}
      />
    </div>
  );
}

// ─── Panel tareas urgentes ────────────────────────────────────────────────────

const PRIORITY_COLOR = {
  urgent: 'text-red-400',
  high:   'text-orange-400',
};

function TodosPanel({ todos }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-300">Urgente / Alta prioridad</span>
          {todos.length > 0 && (
            <span className="font-mono text-xs text-zinc-600">{todos.length}</span>
          )}
        </div>
        <Link
          to="/personal/pendientes"
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Ver todos <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-3 space-y-1">
        {todos.length === 0 ? (
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-6 h-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-3 h-3 text-emerald-400" />
            </div>
            <p className="text-sm text-zinc-500">Sin tareas urgentes</p>
          </div>
        ) : (
          todos.map((t) => (
            <Link
              key={t.id}
              to={`/personal/pendientes?project=${t.project}`}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-zinc-800/60 transition-colors group"
            >
              <PriorityDot priority={t.priority} />
              <span className="text-sm text-zinc-300 flex-1 truncate group-hover:text-zinc-100 transition-colors">
                {t.title}
              </span>
              <ProjectBadge project={t.project} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Panel recordatorios ──────────────────────────────────────────────────────

function RemindersPanel({ reminders }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-sm font-semibold text-zinc-300">Recordatorios</span>
        </div>
        <Link
          to="/personal/recordatorios"
          className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Ver todos <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-3 space-y-1">
        {reminders.length === 0 ? (
          <div className="flex items-center gap-3 px-2 py-3">
            <Bell className="w-4 h-4 text-zinc-600" />
            <p className="text-sm text-zinc-500">Sin recordatorios pendientes</p>
          </div>
        ) : (
          reminders.map((r) => {
            const due = formatReminderDate(r.due_at);
            return (
              <div
                key={r.id}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
              >
                {due?.isPast
                  ? <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  : <Circle className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                }
                <span className="text-sm text-zinc-300 flex-1 truncate">{r.title}</span>
                {due && (
                  <span className={`text-[11px] flex-shrink-0 ${due.isPast ? 'text-red-400' : 'text-zinc-600'}`}>
                    {due.label}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/dashboard')
      .then((r) => {
        const d = r.data;
        if (!d || !Array.isArray(d.businesses)) {
          setError('Respuesta inesperada del servidor');
        } else {
          setData(d);
        }
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.error;
        setError(typeof msg === 'string' ? msg : 'No se pudo cargar el dashboard');
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <PageLoader rows={4} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const { businesses, urgent_todos, reminders_due } = data;

  const totalMRR      = businesses.reduce((s, b) => s + Number(b.mrr || 0), 0);
  const totalIncome   = businesses.reduce((s, b) => s + Number(b.income_month || 0), 0);
  const totalExpenses = businesses.reduce((s, b) => s + Number(b.expenses_month || 0), 0);
  const totalNet      = totalIncome - totalExpenses;

  const mesActual = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <motion.div {...fadeUp} className="min-h-full">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-6 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <h2 className="font-display text-xl font-bold text-zinc-50">{greeting()}, Iván.</h2>
        <p className="text-sm text-zinc-500 mt-0.5 capitalize">{todayLabel()}</p>
      </div>

      <div className="p-8 space-y-8">

        {/* ── Sección negocios ── */}
        <section>
          <SectionLabel>Negocios · {mesActual}</SectionLabel>

          {/* Consolidado */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-card mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-sm font-semibold text-zinc-300">León Ventures — Consolidado</span>
              <Link
                to="/negocios"
                className="ml-auto flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Ver detalle <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="MRR Total"    value={totalMRR     > 0 ? fmx(totalMRR)      : '—'} highlight />
              <StatCard label="Ingresos mes" value={totalIncome  > 0 ? fmx(totalIncome)   : '—'} />
              <StatCard label="Gastos mes"   value={totalExpenses > 0 ? fmx(totalExpenses) : '—'} />
              <StatCard
                label="Neto mes"
                value={totalIncome > 0 || totalExpenses > 0 ? fmx(totalNet) : '—'}
                sub={totalNet > 0 ? 'Positivo' : totalNet < 0 ? 'Negativo' : undefined}
                trend={totalNet}
              />
            </div>
          </div>

          {/* Cards por negocio */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-3 gap-4"
          >
            {businesses.map((b) => (
              <BusinessCard key={b.id} b={b} />
            ))}
          </motion.div>
        </section>

        {/* ── Sección personal ── */}
        <section>
          <SectionLabel>Personal</SectionLabel>
          <div className="grid grid-cols-3 gap-4">
            {/* Fitness panel — ocupa 1 col */}
            <FitnessPanel data={data} />

            {/* Tareas + Recordatorios — ocupan 2 cols */}
            <div className="col-span-2 flex flex-col gap-4">
              <TodosPanel    todos={urgent_todos} />
              <RemindersPanel reminders={reminders_due} />
            </div>
          </div>
        </section>

      </div>
    </motion.div>
  );
}
