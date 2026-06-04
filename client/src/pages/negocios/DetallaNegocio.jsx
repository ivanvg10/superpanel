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
  Minus, ReceiptText, Settings, BarChart2,
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
  live:         { label: 'Live',            cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', ping: true  },
  beta:         { label: 'Beta',            cls: 'bg-blue-500/10    text-blue-400    border-blue-500/20',    ping: false },
  construccion: { label: 'En construcción', cls: 'bg-amber-500/10   text-amber-400   border-amber-500/20',  ping: false },
};

const COLOR_CFG = {
  emerald: { icon: 'text-emerald-400', ring: 'bg-emerald-500/10 border-emerald-500/20' },
  blue:    { icon: 'text-blue-400',    ring: 'bg-blue-500/10    border-blue-500/20'    },
  amber:   { icon: 'text-amber-400',   ring: 'bg-amber-500/10   border-amber-500/20'  },
};

const INCOME_CATEGORIES  = ['Suscripciones', 'Servicios', 'Consultoría', 'Ventas', 'Publicidad', 'Otro'];
const EXPENSE_CATEGORIES = ['Marketing', 'Infraestructura', 'Herramientas', 'Personal', 'Legal', 'Otro'];

const EMPTY_TXN = { type: 'income', amount: '', description: '', category: '', date: '', is_recurring: false };

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function HistoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-400 mb-1.5 capitalize font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-zinc-500">{p.name}:</span>
          <span className="font-mono text-zinc-200">{fmx(p.value)}</span>
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
        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="text-sm font-medium text-zinc-300 capitalize w-36 text-center">
        {monthLabel(value)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(value, 1))}
        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function StatTile({ label, value, color = 'default', icon: Icon }) {
  const colors = {
    default:  'text-zinc-50',
    positive: 'text-emerald-400',
    negative: 'text-red-400',
    accent:   'text-indigo-300',
    muted:    'text-zinc-400',
  };
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-card">
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon className="w-3 h-3 text-zinc-600" />}
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
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
      className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 shadow-card hover:border-zinc-700 transition-all duration-200"
    >
      {/* Type icon */}
      <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${
        isIncome
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-red-500/10    border-red-500/20'
      }`}>
        {isIncome
          ? <TrendingUp   className="w-3.5 h-3.5 text-emerald-400" />
          : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate">
          {txn.description || (isIncome ? 'Ingreso' : 'Gasto')}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {txn.category && (
            <span className="text-[11px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700">
              {txn.category}
            </span>
          )}
          {txn.is_recurring && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-400/70">
              <Repeat2 className="w-2.5 h-2.5" />Recurrente
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <span className={`font-mono font-semibold text-sm flex-shrink-0 ${
        isIncome ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {isIncome ? '+' : '-'}{fmx(txn.amount)}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(txn.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

function PendienteTodo({ todo }) {
  const PRIORITY_TEXT = { urgent: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-zinc-500' };
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50">
      <PriorityDot priority={todo.priority} />
      <span className="text-sm text-zinc-300 flex-1 truncate">{todo.title}</span>
      {todo.due_date && (
        <span className="text-[11px] text-zinc-600 flex-shrink-0">
          {formatDate(todo.due_date)}
        </span>
      )}
    </div>
  );
}

function TransactionForm({ form, setForm, onSubmit, onClose, saving }) {
  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectCls = "w-full bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-sm px-3.5 h-10 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 hover:border-zinc-700 transition-all";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Tipo</label>
        <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
          {[
            { id: 'income',  label: 'Ingreso', active: 'bg-emerald-600 text-white' },
            { id: 'expense', label: 'Gasto',   active: 'bg-red-600 text-white'     },
          ].map(({ id, label, active }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: id, category: '' }))}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                form.type === id ? active : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'
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
        <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Categoría</label>
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
          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-600 accent-indigo-600"
        />
        <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">
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
      <div className="border-b border-zinc-800 px-8 py-5 sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/negocios')}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${col.ring}`}>
              <TrendingUp className={`w-4 h-4 ${col.icon}`} />
            </div>

            <div>
              <h2 className="font-display font-bold text-zinc-50 text-lg leading-tight">
                {business.name}
              </h2>
              {business.description && (
                <p className="text-xs text-zinc-500 mt-0.5">{business.description}</p>
              )}
            </div>

            <div className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border font-medium ${statusCfg.cls}`}>
              {statusCfg.ping && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
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
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 px-3 py-2 rounded-xl transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ir al admin
              </a>
            )}
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
              <span className="absolute top-3 right-3 text-[10px] font-medium text-indigo-400/60 leading-none">
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
              <BarChart2 className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-300">Histórico 6 meses</span>
            </div>
            <div className="px-5 py-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barGap={3} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="#27272A" />
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
                  <Bar dataKey="income" name="Ingresos" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="expenses" name="Gastos" fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── Transacciones ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-300">Transacciones</span>
              <span className="text-xs font-mono text-zinc-600">{transactions.length}</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Type filter */}
              <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
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
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300'
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
                    <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
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

        {/* ── Pendientes de este negocio ── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-300">Tareas pendientes</span>
              {todos.length > 0 && (
                <span className="text-xs font-mono text-zinc-600">{todos.length}</span>
              )}
            </div>
            <Link
              to={`/personal/pendientes?project=${slug}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              Ver en Pendientes
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-5">
            {todos.length === 0 ? (
              <div className="flex items-center gap-3 py-4">
                <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-400">Sin tareas pendientes</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Añade tareas desde{' '}
                    <Link to={`/personal/pendientes?project=${slug}`} className="text-indigo-400 hover:underline">
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
    </motion.div>
  );
}
