import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../../lib/api';
import PageLoader, { ErrorState } from '../../components/ui/PageLoader';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';
import DetallaNegocio from './DetallaNegocio';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmx(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(n) || 0);
}

// ─── Átomos de UI ─────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

const STATUS_CFG = {
  live:         { label: 'Live',            cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: true  },
  beta:         { label: 'Beta',            cls: 'bg-blue-500/10    text-blue-400    border-blue-500/20',    dot: false },
  construccion: { label: 'En construcción', cls: 'bg-amber-500/10   text-amber-400   border-amber-500/20',  dot: false },
};

const COLOR_CFG = {
  emerald: { icon: 'text-emerald-400', ring: 'bg-emerald-500/10 border-emerald-500/20' },
  blue:    { icon: 'text-blue-400',    ring: 'bg-blue-500/10    border-blue-500/20'    },
  amber:   { icon: 'text-amber-400',   ring: 'bg-amber-500/10   border-amber-500/20'  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.construccion;
  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
      {cfg.dot && <LiveDot />}
      {cfg.label}
    </div>
  );
}

function TrendIndicator({ value }) {
  if (!value || value === 0) return <Minus className="w-3.5 h-3.5 text-zinc-500" />;
  return value > 0
    ? <TrendingUp  className="w-3.5 h-3.5 text-emerald-400" />
    : <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
}

// ─── Card de negocio ──────────────────────────────────────────────────────────

function NegocioCard({ business }) {
  const income   = Number(business.income_month)   || 0;
  const expenses = Number(business.expenses_month) || 0;
  const mrr      = Number(business.mrr)            || 0;
  const net      = income - expenses;

  const col = COLOR_CFG[business.color] || COLOR_CFG.blue;

  const metrics = [
    { label: 'MRR',           value: mrr      > 0 ? fmx(mrr)      : '—', mono: true  },
    { label: 'Ingresos mes',  value: income   > 0 ? fmx(income)   : '—', mono: true  },
    { label: 'Gastos mes',    value: expenses > 0 ? fmx(expenses) : '—', mono: true  },
    { label: 'Tareas',        value: business.pending_todos ?? 0,         mono: false },
  ];

  return (
    <motion.div variants={staggerItem}>
      <Link
        to={`/negocios/${business.slug}`}
        className="block bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-card hover:border-zinc-700 hover:shadow-card-hover transition-all duration-200 group"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${col.ring}`}>
              <TrendingUp className={`w-4 h-4 ${col.icon}`} />
            </div>
            <h3 className="font-display font-semibold text-white text-sm leading-tight">
              {business.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={business.status} />
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2.5">
          {metrics.map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-zinc-600">{label}</span>
              <span className={`text-xs ${mono ? 'font-mono text-zinc-400' : 'text-zinc-500'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Net footer */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-600 uppercase tracking-wide">Neto</span>
          <div className="flex items-center gap-1.5">
            <TrendIndicator value={net} />
            <span className={`font-mono text-sm font-semibold ${
              net > 0 ? 'text-emerald-400' : net < 0 ? 'text-red-400' : 'text-zinc-500'
            }`}>
              {income > 0 || expenses > 0 ? fmx(net) : '—'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Vista General ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl p-4 border ${
      highlight
        ? 'bg-indigo-600/10 border-indigo-500/20'
        : 'bg-zinc-800/50 border-zinc-800'
    }`}>
      <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`font-mono text-2xl font-bold leading-none ${highlight ? 'text-indigo-300' : 'text-zinc-200'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-600 mt-1.5">{sub}</p>}
    </div>
  );
}

function VistaGeneral() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/negocios')
      .then((r) => { setBusinesses(r.data); setLoading(false); })
      .catch(() => { setError('Error al cargar negocios'); setLoading(false); });
  };

  useEffect(load, []);

  if (loading) return <PageLoader rows={3} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const totalMRR      = businesses.reduce((s, b) => s + Number(b.mrr || 0), 0);
  const totalIncome   = businesses.reduce((s, b) => s + Number(b.income_month || 0), 0);
  const totalExpenses = businesses.reduce((s, b) => s + Number(b.expenses_month || 0), 0);
  const totalNet      = totalIncome - totalExpenses;

  const now = new Date();
  const mesActual = now.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <motion.div {...fadeUp} className="min-h-full">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-6 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <h2 className="font-display text-xl font-bold text-zinc-50">Negocios</h2>
        <p className="text-sm text-zinc-500 mt-0.5 capitalize">Vista consolidada · {mesActual}</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Consolidado */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-3.5 h-3.5 text-zinc-600" />
            <h3 className="font-display font-semibold text-white text-sm">León Ventures — Consolidado</h3>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <StatCard label="MRR Total"    value={totalMRR     > 0 ? fmx(totalMRR)      : '—'} sub="Recurrente" highlight />
            <StatCard label="Ingresos mes" value={totalIncome  > 0 ? fmx(totalIncome)   : '—'} />
            <StatCard label="Gastos mes"   value={totalExpenses > 0 ? fmx(totalExpenses) : '—'} />
            <StatCard
              label="Neto mes"
              value={totalIncome > 0 || totalExpenses > 0 ? fmx(totalNet) : '—'}
              sub={totalNet > 0 ? 'Positivo' : totalNet < 0 ? 'Negativo' : undefined}
            />
          </div>
        </div>

        {/* Cards de negocios */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {businesses.map((b) => (
            <NegocioCard key={b.id} business={b} />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default function NegociosPage() {
  return (
    <Routes>
      <Route index       element={<VistaGeneral />} />
      <Route path=":slug" element={<DetallaNegocio />} />
      <Route path="*"    element={<Navigate to="/negocios" replace />} />
    </Routes>
  );
}
