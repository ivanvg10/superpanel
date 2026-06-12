import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader, { ErrorState } from '../../components/ui/PageLoader';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';

function todayISO() { return new Date().toISOString().split('T')[0]; }

function formatShortDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ios-elev2 border border-ios-sep rounded-ios px-3 py-2 shadow-popover">
      <p className="text-xs text-ios-label2 mb-0.5">{payload[0]?.payload?.label}</p>
      <p className="font-mono font-semibold text-ios-label">{payload[0]?.value} kg</p>
    </div>
  );
}

export default function Peso() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState({ date: todayISO(), weight_kg: '', notes: '' });
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/personal/weight');
      setEntries(data);
    } catch { setError('No se pudieron cargar los registros'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/personal/weight', {
        date: form.date,
        weight_kg: parseFloat(form.weight_kg),
        notes: form.notes || null,
      });
      setEntries((es) => {
        const updated = es.filter((x) => x.date !== data.date);
        return [data, ...updated].sort((a, b) => b.date.localeCompare(a.date));
      });
      setModal(false);
      setForm({ date: todayISO(), weight_kg: '', notes: '' });
    } catch { /* no-op */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/personal/weight/${id}`);
      setEntries((es) => es.filter((e) => e.id !== id));
    } catch { /* no-op */ }
  };

  if (loading) return <PageLoader rows={3} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const current  = entries[0];
  const previous = entries[1];
  const diff     = current && previous
    ? (parseFloat(current.weight_kg) - parseFloat(previous.weight_kg)).toFixed(1)
    : null;

  // Chart data: reverse to chronological
  const chartData = [...entries].reverse().slice(-90).map((e) => ({
    label: formatShortDate(e.date),
    value: parseFloat(e.weight_kg),
  }));

  const TrendIcon = diff === null ? Minus : parseFloat(diff) < 0 ? TrendingDown : parseFloat(diff) > 0 ? TrendingUp : Minus;
  const trendColor = diff === null ? 'text-ios-label0' : parseFloat(diff) < 0 ? 'text-ios-green' : parseFloat(diff) > 0 ? 'text-ios-red' : 'text-ios-label0';

  return (
    <motion.div {...fadeUp} className="min-h-full">
      <div className="border-b border-ios-sep px-5 pt-7 pb-4 flex items-center justify-between sticky top-0 bg-ios-bg/80 backdrop-blur-xl z-10">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-ios-label">Peso Corporal</h2>
          <p className="text-sm text-ios-label0 mt-0.5">{entries.length} registros</p>
        </div>
        <Button onClick={() => { setForm({ date: todayISO(), weight_kg: '', notes: '' }); setModal(true); }}>
          <Plus className="w-4 h-4" />
          Registrar peso
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="max-w-2xl mx-auto px-4">
          <EmptyState
            icon={TrendingDown}
            title="Sin registros de peso"
            description="Registra tu peso periódicamente para ver tu progreso en una gráfica."
            action={
              <Button onClick={() => setModal(true)} variant="secondary" size="sm">
                <Plus className="w-3.5 h-3.5" />Registrar peso
              </Button>
            }
          />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-ios-elev border border-ios-sep rounded-ios p-4 shadow-card">
              <p className="text-xs text-ios-label0 mb-1">Peso actual</p>
              <p className="font-display font-bold text-ios-label leading-none">
                <span className="text-3xl">{current ? parseFloat(current.weight_kg).toFixed(1) : '—'}</span>
                <span className="text-base text-ios-label2 ml-1">kg</span>
              </p>
            </div>
            <div className="bg-ios-elev border border-ios-sep rounded-ios p-4 shadow-card">
              <p className="text-xs text-ios-label0 mb-1">Cambio</p>
              <div className={`flex items-center gap-1.5 ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="font-display font-bold text-2xl leading-none">
                  {diff !== null ? `${diff > 0 ? '+' : ''}${diff}` : '—'}
                </span>
                {diff !== null && <span className="text-base text-ios-label2">kg</span>}
              </div>
            </div>
            <div className="bg-ios-elev border border-ios-sep rounded-ios p-4 shadow-card">
              <p className="text-xs text-ios-label0 mb-1">Total registros</p>
              <p className="font-display font-bold text-3xl text-ios-label leading-none">{entries.length}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="bg-ios-elev border border-ios-sep rounded-ios p-5 shadow-card mb-6">
              <p className="text-xs font-medium text-ios-label0 mb-4 uppercase tracking-wider">Evolución</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#0A84FF" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0A84FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2C2C2E" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#52525B', fontSize: 11, fontFamily: 'Inter' }}
                    tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fill: '#52525B', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    tickLine={false} axisLine={false}
                    width={42}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3F3F46', strokeWidth: 1 }} />
                  <Area
                    type="monotone" dataKey="value" stroke="#0A84FF" strokeWidth={2}
                    fill="url(#weightGrad)" dot={false} activeDot={{ r: 4, fill: '#0A84FF', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* History list */}
          <div>
            <p className="text-xs font-semibold text-ios-label0 uppercase tracking-widest mb-3">Historial</p>
            <motion.div {...staggerContainer} className="space-y-2">
              {entries.map((e, i) => {
                const prev = entries[i + 1];
                const d = prev ? (parseFloat(e.weight_kg) - parseFloat(prev.weight_kg)).toFixed(1) : null;
                const pos = d !== null && parseFloat(d) > 0;
                const neg = d !== null && parseFloat(d) < 0;
                return (
                  <motion.div
                    key={e.id}
                    layout
                    {...staggerItem}
                    className="group flex items-center gap-4 bg-ios-elev border border-ios-sep rounded-ios px-4 py-3 shadow-card hover:border-ios-sep transition-all duration-200"
                  >
                    <div className="flex-1 flex items-center gap-4">
                      <span className="text-sm font-medium text-ios-label w-24">
                        {formatShortDate(e.date)}
                      </span>
                      <span className="font-mono font-semibold text-ios-label">
                        {parseFloat(e.weight_kg).toFixed(1)} kg
                      </span>
                      {d !== null && (
                        <span className={`text-xs font-mono ${neg ? 'text-ios-green' : pos ? 'text-ios-red' : 'text-ios-label3'}`}>
                          {parseFloat(d) > 0 ? '+' : ''}{d}
                        </span>
                      )}
                      {e.notes && <span className="text-xs text-ios-label3 truncate">{e.notes}</span>}
                    </div>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ios-label3 hover:text-ios-red hover:bg-ios-red/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar peso" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Fecha" type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required className="[color-scheme:dark]"
          />
          <Input label="Peso (kg)" type="number" step="0.1" min="30" max="300"
            value={form.weight_kg}
            onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
            placeholder="82.5" required
          />
          <Input label="Notas (opcional)" as="textarea" rows={2} value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Ayuno, post-entreno…"
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando…' : 'Registrar'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
