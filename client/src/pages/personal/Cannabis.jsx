import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Leaf, Flame } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader, { ErrorState } from '../../components/ui/PageLoader';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';

function todayISO() { return new Date().toISOString().split('T')[0]; }

function formatDisplayDate(str) {
  const d = new Date(str + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  if (d.getTime() === today.getTime()) return 'Hoy';
  const diff = Math.round((today - d) / 86400000);
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

function groupByMonth(entries) {
  return entries.reduce((acc, e) => {
    const key = e.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(year, month - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

function StatsBar({ entries }) {
  const now = new Date(); now.setHours(0,0,0,0);
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek  = entries.filter((e) => new Date(e.date + 'T00:00:00') >= weekStart).length;
  const thisMonth = entries.filter((e) => new Date(e.date + 'T00:00:00') >= monthStart).length;

  // Racha actual (días consecutivos sin consumo desde hoy hacia atrás)
  let streak = 0;
  const today = now.toISOString().split('T')[0];
  const dates = new Set(entries.map((e) => e.date));
  let check = today;
  while (!dates.has(check)) {
    streak++;
    const d = new Date(check + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    check = d.toISOString().split('T')[0];
    if (streak > 365) break;
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {[
        { label: 'Esta semana', value: thisWeek,  unit: 'días' },
        { label: 'Este mes',    value: thisMonth, unit: 'días' },
        { label: 'Racha sin consumo', value: streak, unit: `día${streak !== 1 ? 's' : ''}` },
      ].map(({ label, value, unit }) => (
        <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-card">
          <p className="text-xs text-zinc-500 mb-1">{label}</p>
          <p className="font-display font-bold text-2xl text-zinc-50 leading-none">{value}</p>
          <p className="text-xs text-zinc-600 mt-0.5">{unit}</p>
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM = { date: todayISO(), sessions: '1', notes: '' };

export default function Cannabis() {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/personal/cannabis');
      setEntries(data);
    } catch { setError('No se pudieron cargar los registros'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/personal/cannabis', {
        date: form.date,
        sessions: Number(form.sessions) || 1,
        notes: form.notes || null,
      });
      setEntries((es) => {
        const updated = es.filter((x) => x.date !== data.date);
        return [data, ...updated].sort((a, b) => b.date.localeCompare(a.date));
      });
      setModal(false);
      setForm(EMPTY_FORM);
    } catch { /* no-op */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/personal/cannabis/${id}`);
      setEntries((es) => es.filter((e) => e.id !== id));
    } catch { /* no-op */ }
  };

  if (loading) return <PageLoader rows={4} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const grouped = groupByMonth(entries);

  return (
    <motion.div {...fadeUp} className="min-h-full">
      <div className="border-b border-zinc-800 px-8 py-6 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-50">Cannabis</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{entries.length} días registrados</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          <Plus className="w-4 h-4" />
          Registrar
        </Button>
      </div>

      <div className="px-8 py-6">
        {entries.length > 0 && <StatsBar entries={entries} />}

        {entries.length === 0 ? (
          <EmptyState
            icon={Leaf}
            title="Sin registros"
            description="Registra tus días de consumo para hacer un seguimiento del hábito."
            action={
              <Button onClick={() => setModal(true)} variant="secondary" size="sm">
                <Plus className="w-3.5 h-3.5" />Registrar
              </Button>
            }
          />
        ) : (
          <motion.div {...staggerContainer} className="space-y-8">
            {Object.entries(grouped).map(([month, items]) => (
              <motion.section key={month} {...staggerItem}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest capitalize">
                    {monthLabel(month)}
                  </h3>
                  <span className="text-xs text-zinc-600 font-mono">{items.length} días</span>
                </div>
                <div className="space-y-2">
                  {items.map((e) => (
                    <motion.div
                      key={e.id}
                      layout
                      className="group flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 shadow-card hover:border-zinc-700 hover:shadow-card-hover transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-zinc-200">{formatDisplayDate(e.date)}</span>
                          {e.sessions > 1 && (
                            <span className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
                              <Flame className="w-3 h-3" />{e.sessions}×
                            </span>
                          )}
                        </div>
                        {e.notes && <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{e.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            ))}
          </motion.div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar consumo" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Fecha" type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required className="[color-scheme:dark]"
          />
          <Input label="Sesiones" type="number" min="1" max="20" value={form.sessions}
            onChange={(e) => setForm((f) => ({ ...f, sessions: e.target.value }))}
            hint="Cuántas veces en el día"
          />
          <Input label="Notas (opcional)" as="textarea" rows={2} value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Contexto, cantidad, etc."
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
