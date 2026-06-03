import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Clock, CalendarDays, Repeat2 } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader, { ErrorState } from '../../components/ui/PageLoader';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';

function BoxIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l3 3m6 6l3 3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function todayISO() { return new Date().toISOString().split('T')[0]; }

function formatDisplayDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

function groupByMonth(sessions) {
  return sessions.reduce((acc, s) => {
    const key = s.date.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
}

function monthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(year, month - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

function StatsBar({ sessions }) {
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek  = sessions.filter((s) => new Date(s.date + 'T00:00:00') >= weekStart).length;
  const thisMonth = sessions.filter((s) => new Date(s.date + 'T00:00:00') >= monthStart).length;
  const avgRounds = sessions.filter((s) => s.rounds).reduce((a, s, _, arr) => a + s.rounds / arr.length, 0);

  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {[
        { label: 'Esta semana',   value: thisWeek,  unit: 'sesiones' },
        { label: 'Este mes',      value: thisMonth, unit: 'sesiones' },
        { label: 'Rounds promedio', value: avgRounds ? avgRounds.toFixed(1) : '—', unit: null },
      ].map(({ label, value, unit }) => (
        <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-card">
          <p className="text-xs text-zinc-500 mb-1">{label}</p>
          <p className="font-display font-bold text-2xl text-zinc-50 leading-none">{value}</p>
          {unit && <p className="text-xs text-zinc-600 mt-0.5">{unit}</p>}
        </div>
      ))}
    </div>
  );
}

const EMPTY_FORM = { date: todayISO(), duration_minutes: '', rounds: '', notes: '' };

export default function Box() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/personal/box');
      setSessions(data);
    } catch { setError('No se pudieron cargar las sesiones'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/personal/box', {
        date: form.date,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
        rounds: form.rounds ? Number(form.rounds) : null,
        notes: form.notes || null,
      });
      setSessions((ss) => [data, ...ss].sort((a, b) => b.date.localeCompare(a.date)));
      setModal(false);
      setForm(EMPTY_FORM);
    } catch { /* no-op */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/personal/box/${id}`);
      setSessions((ss) => ss.filter((s) => s.id !== id));
    } catch { /* no-op */ }
  };

  if (loading) return <PageLoader rows={4} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const grouped = groupByMonth(sessions);

  return (
    <motion.div {...fadeUp} className="min-h-full">
      <div className="border-b border-zinc-800 px-8 py-6 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-50">Box</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{sessions.length} sesiones registradas</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          <Plus className="w-4 h-4" />
          Registrar sesión
        </Button>
      </div>

      <div className="px-8 py-6">
        {sessions.length > 0 && <StatsBar sessions={sessions} />}

        {sessions.length === 0 ? (
          <EmptyState
            icon={Repeat2}
            title="Sin sesiones registradas"
            description="Registra tu primera sesión de box para empezar el seguimiento."
            action={
              <Button onClick={() => setModal(true)} variant="secondary" size="sm">
                <Plus className="w-3.5 h-3.5" />Registrar sesión
              </Button>
            }
          />
        ) : (
          <motion.div {...staggerContainer} className="space-y-8">
            {Object.entries(grouped).map(([month, items]) => (
              <motion.section key={month} {...staggerItem}>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 capitalize">
                  {monthLabel(month)}
                </h3>
                <div className="space-y-2">
                  {items.map((s) => (
                    <motion.div
                      key={s.id}
                      layout
                      className="group flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 shadow-card hover:border-zinc-700 hover:shadow-card-hover transition-all duration-200"
                    >
                      <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BoxIcon className="w-4 h-4 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                            <CalendarDays className="w-3.5 h-3.5 text-zinc-500" />
                            {formatDisplayDate(s.date)}
                          </span>
                          {s.duration_minutes && (
                            <span className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
                              <Clock className="w-3 h-3" />{s.duration_minutes} min
                            </span>
                          )}
                          {s.rounds && (
                            <span className="flex items-center gap-1 text-xs text-orange-400/80 font-mono">
                              <Repeat2 className="w-3 h-3" />{s.rounds} rounds
                            </span>
                          )}
                        </div>
                        {s.notes && <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{s.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleDelete(s.id)}
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar sesión de box" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Fecha" type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required className="[color-scheme:dark]"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Duración (min)" type="number" min="1" max="300" value={form.duration_minutes}
              onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} placeholder="60"
            />
            <Input label="Rounds" type="number" min="1" max="99" value={form.rounds}
              onChange={(e) => setForm((f) => ({ ...f, rounds: e.target.value }))} placeholder="12"
            />
          </div>
          <Input label="Notas" as="textarea" rows={3} value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Técnica, sparring, observaciones…"
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
