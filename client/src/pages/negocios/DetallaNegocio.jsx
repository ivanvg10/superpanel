import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  ArrowLeft, ArrowUpRight, Plus, Trash2,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Repeat2, CheckSquare, Circle, CheckCheck, ExternalLink,
  Minus, ReceiptText, Settings, BarChart2, Zap,
} from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader, { ErrorState } from '../../components/ui/PageLoader';
import { PriorityDot } from '../../components/ui/Badge';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmx(n, sign = false) {
  const v = Number(n) || 0;
  const f = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Math.abs(v));
  if (!sign) return f;
  return v > 0 ? `+${f}` : v < 0 ? `-${f}` : f;
}

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

function formatDate(str) {
  return new Date(str + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function monthShort(ym) {
  const [y, m] = ym.split('-');
  return new Date(y, m - 1).toLocaleDateString('es-MX', { month: 'short' }).replace('.', '');
}

function groupByDate(txns) {
  return txns.reduce((acc, t) => {
    const k = t.date.split('T')[0].slice(0, 10);
    if (!acc[k]) acc[k] = [];
    acc[k].push(t);
    return acc;
  }, {});
}

const STATUS_CFG = {
  live:         { label: 'Live',            cls: 'bg-ios-green/10 text-ios-green border-ios-green/20', ping: true  },
  beta:         { label: 'Beta',            cls: 'bg-ios-blue/10    text-ios-blue    border-ios-blue/20',    ping: false },
  construccion: { label: 'En construcción', cls: 'bg-ios-orange/10   text-ios-orange   border-ios-orange/20',  ping: false },
};

const COLOR_CFG = {
  emerald: { icon: 'text-ios-green', ring: 'bg-ios-green/10 border-ios-green/20' },
  blue:    { icon: 'text-ios-blue',    ring: 'bg-ios-blue/10    border-ios-blue/20'    },
  amber:   { icon: 'text-ios-orange',   ring: 'bg-ios-orange/10   border-ios-orange/20'  },
};

const STATUS_OPTIONS = [
  { id: 'construccion', label: 'En construcción' },
  { id: 'beta',         label: 'Beta'            },
  { id: 'live',         label: 'Live'            },
];

const EDIT_COLOR_OPTIONS = [
  { id: 'blue',    label: 'Azul',  dot: 'bg-ios-blue'    },
  { id: 'emerald', label: 'Verde', dot: 'bg-ios-green' },
  { id: 'amber',   label: 'Ámbar', dot: 'bg-ios-orange'   },
];

const INCOME_CATEGORIES  = ['Suscripciones', 'Servicios', 'Consultoría', 'Ventas', 'Publicidad', 'Otro'];
const EXPENSE_CATEGORIES = ['Marketing', 'Infraestructura', 'Herramientas', 'Personal', 'Legal', 'Otro'];

const EMPTY_TXN = { type: 'income', amount: '', description: '', category: '', date: '', is_recurring: false };

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function HistoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ios-elev border border-ios-sep rounded-ios px-3 py-2 shadow-xl text-xs">
      <p className="text-ios-label2 mb-1.5 capitalize font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-ios-label2">{p.name}:</span>
          <span className="font-mono text-ios-label">{fmx(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function MonthPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(shiftMonth(value, -1))}
        className="p-1.5 rounded-lg text-ios-label2 hover:text-ios-label hover:bg-ios-elev2 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="text-sm font-medium text-ios-label capitalize w-36 text-center">
        {monthLabel(value)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(value, 1))}
        className="p-1.5 rounded-lg text-ios-label2 hover:text-ios-label hover:bg-ios-elev2 transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function StatTile({ label, value, color = 'default', icon: Icon }) {
  const colors = {
    default:  'text-ios-label',
    positive: 'text-ios-green',
    negative: 'text-ios-red',
    accent:   'text-ios-blue',
    muted:    'text-ios-label2',
  };
  return (
    <div className="bg-ios-elev border border-ios-sep rounded-ios p-4 shadow-card">
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon className="w-3 h-3 text-ios-label3" />}
        <p className="text-[11px] font-medium text-ios-label2 uppercase tracking-wide">{label}</p>
      </div>
      <p className={`font-mono font-bold text-xl leading-none ${colors[color]}`}>{value}</p>
    </div>
  );
}

function TransactionRow({ txn, onDelete }) {
  const isIncome = txn.type === 'income';
  return (
    <motion.div
      layout
      {...staggerItem}
      className="group flex items-center gap-3 px-4 py-3 rounded-ios border border-ios-sep bg-ios-elev shadow-card hover:border-ios-sep transition-all duration-200"
    >
      {/* Type icon */}
      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${
        isIncome
          ? 'bg-ios-green/10 border-ios-green/20'
          : 'bg-ios-red/10    border-ios-red/20'
      }`}>
        {isIncome
          ? <TrendingUp   className="w-3.5 h-3.5 text-ios-green" />
          : <TrendingDown className="w-3.5 h-3.5 text-ios-red" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ios-label truncate">
          {txn.description || (isIncome ? 'Ingreso' : 'Gasto')}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {txn.category && (
            <span className="text-[11px] bg-ios-elev2 text-ios-label2 px-1.5 py-0.5 rounded border border-ios-sep">
              {txn.category}
            </span>
          )}
          {txn.is_recurring && (
            <span className="flex items-center gap-1 text-[11px] text-ios-blue/70">
              <Repeat2 className="w-2.5 h-2.5" />Recurrente
            </span>
          )}
          {txn.origen === 'espejo' && (
            <span className="flex items-center gap-1 text-[11px] text-ios-orange/80">
              <Zap className="w-2.5 h-2.5" />Auto
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <span className={`font-mono font-semibold text-sm flex-shrink-0 ${
        isIncome ? 'text-ios-green' : 'text-ios-red'
      }`}>
        {isIncome ? '+' : '-'}{fmx(txn.amount)}
      </span>

      {/* Delete — las filas espejo (origen externo) son de solo lectura */}
      {txn.origen === 'espejo' ? (
        <span className="w-[30px] flex-shrink-0" aria-hidden />
      ) : (
        <button
          onClick={() => onDelete(txn.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ios-label3 hover:text-ios-red hover:bg-ios-red/10 transition-all flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}

function PendienteTodo({ todo }) {
  const PRIORITY_TEXT = { urgent: 'text-ios-red', high: 'text-ios-orange', medium: 'text-ios-yellow', low: 'text-ios-label2' };
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-ios border border-ios-sep bg-ios-elev/50">
      <PriorityDot priority={todo.priority} />
      <span className="text-sm text-ios-label flex-1 truncate">{todo.title}</span>
      {todo.due_date && (
        <span className="text-[11px] text-ios-label3 flex-shrink-0">
          {formatDate(todo.due_date)}
        </span>
      )}
    </div>
  );
}

function EditNegocioForm({ form, setForm, onSubmit, onClose, saving, error }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Nombre"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
        <label className="block text-xs font-medium text-ios-label2 uppercase tracking-wide mb-1.5">Estado</label>
        <div className="flex rounded-ios border border-ios-sep overflow-hidden">
          {STATUS_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, status: id }))}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                form.status === id
                  ? 'bg-ios-blue text-white'
                  : 'text-ios-label2 hover:text-ios-label hover:bg-ios-elev2/60'
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
          {EDIT_COLOR_OPTIONS.map(({ id, label, dot }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, color: id }))}
              className={`flex items-center gap-2 px-3 py-2 rounded-ios border text-xs font-medium transition-all ${
                form.color === id
                  ? 'border-ios-blue/60 bg-ios-blue/10 text-ios-label'
                  : 'border-ios-sep text-ios-label2 hover:border-ios-sep hover:text-ios-label'
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
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

function TransactionForm({ form, setForm, onSubmit, onClose, saving }) {
  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectCls = "w-full bg-ios-elev border border-ios-sep rounded-ios text-ios-label text-sm px-3.5 h-10 outline-none focus:ring-2 focus:ring-ios-blue/40 focus:border-ios-blue/60 hover:border-ios-sep transition-all";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="block text-xs font-medium text-ios-label2 uppercase tracking-wide mb-1.5">Tipo</label>
        <div className="flex rounded-ios border border-ios-sep overflow-hidden">
          {[
            { id: 'income',  label: 'Ingreso', active: 'bg-ios-green text-white' },
            { id: 'expense', label: 'Gasto',   active: 'bg-ios-red text-white'     },
          ].map(({ id, label, active }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: id, category: '' }))}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                form.type === id ? active : 'text-ios-label2 hover:text-ios-label hover:bg-ios-elev2/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount + Date */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Monto (MXN)"
          type="number" step="0.01" min="0.01"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          placeholder="0.00" required
        />
        <Input
          label="Fecha"
          type="date"
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className="[color-scheme:dark]"
        />
      </div>

      {/* Description */}
      <Input
        label="Descripción"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder={form.type === 'income' ? 'Ej. Suscripciones mensuales' : 'Ej. Meta Ads — junio'}
      />

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ios-label2 uppercase tracking-wide">Categoría</label>
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className={selectCls}
        >
          <option value="">Sin categoría</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Recurring */}
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={form.is_recurring}
          onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
          className="w-4 h-4 rounded border-ios-sep bg-ios-elev text-ios-blue accent-ios-blue"
        />
        <span className="text-sm text-ios-label2 group-hover:text-ios-label transition-colors">
          Recurrente mensual (cuenta para MRR)
        </span>
      </label>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Guardando…' : 'Registrar'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DetallaNegocio() {
  const { slug }     = useParams();
  const navigate     = useNavigate();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [month, setMonth]       = useState(currentMonthISO);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ ...EMPTY_TXN, date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving]     = useState(false);
  const [txnFilter, setTxnFilter] = useState('all'); // 'all' | 'income' | 'expense'

  const [editModal, setEditModal]   = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: res } = await api.get(`/negocios/${slug}?month=${month}`);
      setData(res);
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/negocios', { replace: true });
      } else {
        setError('No se pudo cargar el negocio');
      }
    } finally {
      setLoading(false);
    }
  }, [slug, month, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleAddTxn = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/negocios/${slug}/transactions`, {
        ...form,
        amount: parseFloat(form.amount),
        date: form.date || new Date().toISOString().split('T')[0],
      });
      setModal(false);
      setForm({ ...EMPTY_TXN, date: new Date().toISOString().split('T')[0] });
      load(); // recarga todo para actualizar stats
    } catch { /* no-op */ }
    finally { setSaving(false); }
  };

  const handleDeleteTxn = async (id) => {
    try {
      await api.delete(`/negocios/transactions/${id}`);
      setData((d) => ({
        ...d,
        transactions: d.transactions.filter((t) => t.id !== id),
      }));
    } catch { /* no-op */ }
  };

  const openEditModal = () => {
    setEditForm({
      name:        data.business.name        || '',
      description: data.business.description || '',
      url:         data.business.url         || '',
      admin_url:   data.business.admin_url   || '',
      status:      data.business.status      || 'construccion',
      color:       data.business.color       || 'blue',
    });
    setEditError(null);
    setEditModal(true);
  };

  const handleEditBiz = async (e) => {
    e.preventDefault();
    setSavingEdit(true); setEditError(null);
    try {
      const { data: updated } = await api.patch(`/negocios/${slug}`, editForm);
      setData((d) => ({ ...d, business: updated }));
      setEditModal(false);
      window.dispatchEvent(new Event('negocios-updated'));
    } catch (err) {
      const msg = err.response?.data?.error;
      setEditError(typeof msg === 'string' ? msg : 'Error al guardar');
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <PageLoader rows={4} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;
  if (!data)   return null;

  const { business, transactions, todos, history, currentMrr } = data;
  const col = COLOR_CFG[business.color] || COLOR_CFG.blue;
  const statusCfg = STATUS_CFG[business.status] || STATUS_CFG.construccion;

  // Stats del mes seleccionado
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const net      = income - expenses;
  const mrr      = currentMrr ?? 0; // siempre del mes actual, no del mes navegado
  const isHistoricMonth = month !== currentMonthISO();

  const chartData = (history || []).map((h) => ({
    label: monthShort(h.month),
    income: Number(h.income),
    expenses: Number(h.expenses),
  }));

  // Filtrado de transacciones
  const visibleTxns = transactions.filter(t => txnFilter === 'all' || t.type === txnFilter);
  const grouped = groupByDate(visibleTxns);

  return (
    <motion.div {...fadeUp} className="min-h-full">
      {/* ── Header ── */}
      <div className="border-b border-ios-sep px-5 pt-7 pb-4 sticky top-0 bg-ios-bg/80 backdrop-blur-xl z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/negocios')}
              className="p-1.5 rounded-lg text-ios-label3 hover:text-ios-label hover:bg-ios-elev2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className={`w-8 h-8 rounded-ios border flex items-center justify-center flex-shrink-0 ${col.ring}`}>
              <TrendingUp className={`w-4 h-4 ${col.icon}`} />
            </div>

            <div>
              <h2 className="font-display font-bold text-ios-label text-lg leading-tight">
                {business.name}
              </h2>
              {business.description && (
                <p className="text-xs text-ios-label2 mt-0.5">{business.description}</p>
              )}
            </div>

            <div className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusCfg.cls}`}>
              {statusCfg.ping && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ios-green opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ios-green" />
                </span>
              )}
              {statusCfg.label}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {business.admin_url && (
              <a
                href={business.admin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ios-label2 hover:text-ios-label bg-ios-elev2 hover:bg-ios-elev2 border border-ios-sep hover:border-ios-label3 px-3 py-2 rounded-ios transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ir al admin
              </a>
            )}
            <button
              onClick={openEditModal}
              className="p-2 rounded-ios text-ios-label2 hover:text-ios-label hover:bg-ios-elev2 border border-transparent hover:border-ios-sep transition-all"
              title="Editar negocio"
            >
              <Settings className="w-4 h-4" />
            </button>
            <Button onClick={() => { setForm({ ...EMPTY_TXN, date: new Date().toISOString().split('T')[0] }); setModal(true); }}>
              <Plus className="w-4 h-4" />
              Transacción
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-3">
          <div className="relative">
            <StatTile
              label="MRR"
              value={mrr > 0 ? fmx(mrr) : '—'}
              color="accent"
              icon={Repeat2}
            />
            {isHistoricMonth && mrr > 0 && (
              <span className="absolute top-3 right-3 text-[10px] font-medium text-ios-blue/60 leading-none">
                hoy
              </span>
            )}
          </div>
          <StatTile
            label="Ingresos"
            value={income > 0 ? fmx(income) : '—'}
            color={income > 0 ? 'positive' : 'muted'}
            icon={TrendingUp}
          />
          <StatTile
            label="Gastos"
            value={expenses > 0 ? fmx(expenses) : '—'}
            color={expenses > 0 ? 'negative' : 'muted'}
            icon={TrendingDown}
          />
          <StatTile
            label="Neto"
            value={income > 0 || expenses > 0 ? fmx(net) : '—'}
            color={net > 0 ? 'positive' : net < 0 ? 'negative' : 'muted'}
            icon={net >= 0 ? TrendingUp : TrendingDown}
          />
        </div>

        {/* ── Histórico 6 meses ── */}
        {chartData.length > 0 && (
          <div className="bg-ios-elev border border-ios-sep rounded-ios shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-ios-sep">
              <BarChart2 className="w-3.5 h-3.5 text-ios-label2" />
              <span className="text-sm font-semibold text-ios-label">Histórico 6 meses</span>
            </div>
            <div className="px-5 py-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barGap={3} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#2C2C2E" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'Inter' }}
                    tickLine={false} axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickLine={false} axisLine={false}
                    width={54}
                    tickFormatter={(v) => v === 0 ? '0' : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`}
                  />
                  <Tooltip content={<HistoryTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)', radius: 4 }} />
                  <Bar dataKey="income" name="Ingresos" fill="#30D158" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="expenses" name="Gastos" fill="#FF453A" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Transacciones ── */}
        <div className="bg-ios-elev border border-ios-sep rounded-ios shadow-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ios-sep">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-3.5 h-3.5 text-ios-label2" />
              <span className="text-sm font-semibold text-ios-label">Transacciones</span>
              <span className="text-xs font-mono text-ios-label3">{transactions.length}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Type filter */}
              <div className="flex gap-1 bg-ios-elev2 rounded-lg p-1">
                {[
                  { id: 'all',     label: 'Todas'   },
                  { id: 'income',  label: 'Ingresos' },
                  { id: 'expense', label: 'Gastos'   },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setTxnFilter(id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      txnFilter === id
                        ? 'bg-ios-elev2 text-ios-label'
                        : 'text-ios-label2 hover:text-ios-label'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <MonthPicker value={month} onChange={setMonth} />
            </div>
          </div>

          {/* List */}
          <div className="p-5">
            {visibleTxns.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="Sin transacciones"
                description={`No hay ${txnFilter === 'income' ? 'ingresos' : txnFilter === 'expense' ? 'gastos' : 'transacciones'} registradas en ${monthLabel(month)}.`}
                action={
                  <Button onClick={() => setModal(true)} variant="secondary" size="sm">
                    <Plus className="w-3.5 h-3.5" />Registrar
                  </Button>
                }
              />
            ) : (
              <motion.div {...staggerContainer} className="space-y-5">
                {Object.entries(grouped).map(([date, items]) => (
                  <motion.div key={date} {...staggerItem}>
                    <p className="text-[11px] font-semibold text-ios-label3 uppercase tracking-widest mb-2">
                      {formatDate(date)}
                    </p>
                    <div className="space-y-2">
                      {items.map((txn) => (
                        <TransactionRow
                          key={txn.id}
                          txn={txn}
                          onDelete={handleDeleteTxn}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Panel León Coach (solo visible para este negocio) ── */}

        {/* ── Pendientes de este negocio ── */}
        <div className="bg-ios-elev border border-ios-sep rounded-ios shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ios-sep">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-ios-label2" />
              <span className="text-sm font-semibold text-ios-label">Tareas pendientes</span>
              {todos.length > 0 && (
                <span className="text-xs font-mono text-ios-label3">{todos.length}</span>
              )}
            </div>
            <Link
              to={`/personal/pendientes?project=${slug}`}
              className="text-xs text-ios-blue hover:text-ios-blue transition-colors flex items-center gap-1"
            >
              Ver en Pendientes
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-5">
            {todos.length === 0 ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-8 h-8 bg-ios-green/10 border border-ios-green/20 rounded-ios flex items-center justify-center flex-shrink-0">
                  <CheckCheck className="w-4 h-4 text-ios-green" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ios-label2">Sin tareas pendientes</p>
                  <p className="text-xs text-ios-label3 mt-0.5">
                    Añade tareas desde{' '}
                    <Link to={`/personal/pendientes?project=${slug}`} className="text-ios-blue hover:underline">
                      Pendientes
                    </Link>
                  </p>
                </div>
              </div>
            ) : (
              <motion.div {...staggerContainer} className="space-y-2">
                {todos.map((todo) => (
                  <motion.div key={todo.id} {...staggerItem}>
                    <PendienteTodo todo={todo} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal transacción ── */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={`Nueva transacción — ${business.name}`}
      >
        <TransactionForm
          form={form}
          setForm={setForm}
          onSubmit={handleAddTxn}
          onClose={() => setModal(false)}
          saving={saving}
        />
      </Modal>

      {/* ── Modal editar negocio ── */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title={`Editar — ${business.name}`}
        size="lg"
      >
        <EditNegocioForm
          form={editForm}
          setForm={setEditForm}
          onSubmit={handleEditBiz}
          onClose={() => setEditModal(false)}
          saving={savingEdit}
          error={editError}
        />
      </Modal>
    </motion.div>
  );
}
