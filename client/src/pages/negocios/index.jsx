import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
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

// ─── Nuevo Negocio ────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { id: 'construccion', label: 'En construcción' },
  { id: 'beta',         label: 'Beta'            },
  { id: 'live',         label: 'Live'            },
];

const COLOR_OPTIONS = [
  { id: 'blue',    label: 'Azul',  dot: 'bg-blue-500'    },
  { id: 'emerald', label: 'Verde', dot: 'bg-emerald-500' },
  { id: 'amber',   label: 'Ámbar', dot: 'bg-amber-500'   },
];

const EMPTY_BIZ = { name: '', description: '', url: '', admin_url: '', status: 'construccion', color: 'blue' };

function NuevoNegocioForm({ form, setForm, onSubmit, onClose, saving, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Nombre"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="Ej. Superpanel, Chai Fit…"
        required
        autoFocus
      />
      <Input
        as="textarea"
        label="Descripción"
        rows={2}
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Descripción breve del negocio"
      />

      {/* Status */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Estado inicial</label>
        <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
          {STATUS_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: id }))}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                form.status === id
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Color</label>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map(({ id, label, dot }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: id }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                form.color === id
                  ? 'border-indigo-500/60 bg-indigo-500/10 text-zinc-100'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="URL pública"
          type="url"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          placeholder="https://…"
        />
        <Input
          label="URL admin"
          type="url"
          value={form.admin_url}
          onChange={(e) => setForm((f) => ({ ...f, admin_url: e.target.value }))}
          placeholder="https://…/admin"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Creando…' : 'Crear negocio'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
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
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const [newModal, setNewModal]     = useState(false);
  const [newForm, setNewForm]       = useState({ ...EMPTY_BIZ });
  const [savingNew, setSavingNew]   = useState(false);
  const [newError, setNewError]     = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/negocios')
      .then((r) => { setBusinesses(r.data); setLoading(false); })
      .catch(() => { setError('Error al cargar negocios'); setLoading(false); });
  };

  useEffect(load, []);

  const handleCreateBiz = async (e) => {
    e.preventDefault();
    setSavingNew(true); setNewError(null);
    try {
      const { data: biz } = await api.post('/negocios', newForm);
      setNewModal(false);
      setNewForm({ ...EMPTY_BIZ });
      window.dispatchEvent(new Event('negocios-updated'));
      navigate(`/negocios/${biz.slug}`);
    } catch (err) {
      const msg = err.response?.data?.error;
      setNewError(typeof msg === 'string' ? msg : 'Error al crear negocio');
    } finally {
      setSavingNew(false);
    }
  };

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
      <div className="border-b border-zinc-800 px-8 py-5 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-zinc-50">Negocios</h2>
            <p className="text-sm text-zinc-500 mt-0.5 capitalize">Vista consolidada · {mesActual}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setNewForm({ ...EMPTY_BIZ }); setNewError(null); setNewModal(true); }}
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo negocio
          </Button>
        </div>
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

      <Modal
        isOpen={newModal}
        onClose={() => setNewModal(false)}
        title="Nuevo negocio"
        size="lg"
      >
        <NuevoNegocioForm
          form={newForm}
          setForm={setNewForm}
          onSubmit={handleCreateBiz}
          onClose={() => setNewModal(false)}
          saving={savingNew}
          error={newError}
        />
      </Modal>
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
