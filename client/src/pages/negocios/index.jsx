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
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ios-green opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-ios-green" />
    </span>
  );
}

const STATUS_CFG = {
  live:         { label: 'Live',            cls: 'bg-ios-green/10 text-ios-green border-ios-green/20', dot: true  },
  beta:         { label: 'Beta',            cls: 'bg-ios-blue/10    text-ios-blue    border-ios-blue/20',    dot: false },
  construccion: { label: 'En construcción', cls: 'bg-ios-orange/10   text-ios-orange   border-ios-orange/20',  dot: false },
};

const COLOR_CFG = {
  emerald: { icon: 'text-ios-green', ring: 'bg-ios-green/10 border-ios-green/20' },
  blue:    { icon: 'text-ios-blue',    ring: 'bg-ios-blue/10    border-ios-blue/20'    },
  amber:   { icon: 'text-ios-orange',   ring: 'bg-ios-orange/10   border-ios-orange/20'  },
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
  if (!value || value === 0) return <Minus className="w-3.5 h-3.5 text-ios-label0" />;
  return value > 0
    ? <TrendingUp  className="w-3.5 h-3.5 text-ios-green" />
    : <TrendingDown className="w-3.5 h-3.5 text-ios-red" />;
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
        className="block bg-ios-elev border border-ios-sep rounded-ios p-5 shadow-card hover:border-ios-sep hover:shadow-card-hover transition-all duration-200 group"
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
            <ArrowUpRight className="w-3.5 h-3.5 text-ios-label3 group-hover:text-ios-label2 transition-colors" />
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2.5">
          {metrics.map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-ios-label3">{label}</span>
              <span className={`text-xs ${mono ? 'font-mono text-ios-label2' : 'text-ios-label0'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Net footer */}
        <div className="mt-4 pt-3.5 border-t border-ios-sep flex items-center justify-between">
          <span className="text-[11px] text-ios-label3 uppercase tracking-wide">Neto</span>
          <div className="flex items-center gap-1.5">
            <TrendIndicator value={net} />
            <span className={`font-mono text-sm font-semibold ${
              net > 0 ? 'text-ios-green' : net < 0 ? 'text-ios-red' : 'text-ios-label0'
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
  { id: 'blue',    label: 'Azul',  dot: 'bg-ios-blue'    },
  { id: 'emerald', label: 'Verde', dot: 'bg-ios-green' },
  { id: 'amber',   label: 'Ámbar', dot: 'bg-ios-orange'   },
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
        <label className="block text-xs font-medium text-ios-label2 uppercase tracking-wide mb-1.5">Estado inicial</label>
        <div className="flex rounded-ios border border-ios-sep overflow-hidden">
          {STATUS_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: id }))}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                form.status === id
                  ? 'bg-ios-blue text-white'
                  : 'text-ios-label0 hover:text-ios-label hover:bg-ios-elev2/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-medium text-ios-label2 uppercase tracking-wide mb-1.5">Color</label>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map(({ id, label, dot }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: id }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-ios border text-xs font-medium transition-all ${
                form.color === id
                  ? 'border-ios-blue/60 bg-ios-blue/10 text-ios-label'
                  : 'border-ios-sep text-ios-label0 hover:border-ios-sep hover:text-ios-label'
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

      {error && <p className="text-sm text-ios-red">{error}</p>}

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
    <div className={`rounded-ios p-4 border ${
      highlight
        ? 'bg-ios-blue/10 border-ios-blue/20'
        : 'bg-ios-elev2/50 border-ios-sep'
    }`}>
      <p className="text-[11px] font-medium text-ios-label0 uppercase tracking-wide mb-2">{label}</p>
      <p className={`font-mono text-2xl font-bold leading-none ${highlight ? 'text-ios-blue' : 'text-ios-label'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-ios-label3 mt-1.5">{sub}</p>}
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
      <div className="border-b border-ios-sep px-5 pt-7 pb-4 sticky top-0 bg-ios-bg/80 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-bold tracking-tight text-ios-label">Negocios</h2>
            <p className="text-sm text-ios-label0 mt-0.5 capitalize">Vista consolidada · {mesActual}</p>
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
        <div className="bg-ios-elev border border-ios-sep rounded-ios p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-3.5 h-3.5 text-ios-label3" />
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
