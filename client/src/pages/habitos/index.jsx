import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Flame, Trash2, Pencil } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader, { ErrorState } from '../../components/ui/PageLoader';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';

// Paleta de colores seleccionables por hábito (clases estáticas para Tailwind).
const TONE = {
  blue:   { solid: 'bg-ios-blue',   soft: 'bg-ios-blue/15',   text: 'text-ios-blue',   bar: 'bg-ios-blue' },
  green:  { solid: 'bg-ios-green',  soft: 'bg-ios-green/15',  text: 'text-ios-green',  bar: 'bg-ios-green' },
  orange: { solid: 'bg-ios-orange', soft: 'bg-ios-orange/15', text: 'text-ios-orange', bar: 'bg-ios-orange' },
  red:    { solid: 'bg-ios-red',    soft: 'bg-ios-red/15',    text: 'text-ios-red',    bar: 'bg-ios-red' },
  purple: { solid: 'bg-ios-purple', soft: 'bg-ios-purple/15', text: 'text-ios-purple', bar: 'bg-ios-purple' },
  teal:   { solid: 'bg-ios-teal',   soft: 'bg-ios-teal/15',   text: 'text-ios-teal',   bar: 'bg-ios-teal' },
  pink:   { solid: 'bg-ios-pink',   soft: 'bg-ios-pink/15',   text: 'text-ios-pink',   bar: 'bg-ios-pink' },
  yellow: { solid: 'bg-ios-yellow', soft: 'bg-ios-yellow/15', text: 'text-ios-yellow', bar: 'bg-ios-yellow' },
};
const COLORS = Object.keys(TONE);
const tone = (c) => TONE[c] || TONE.blue;

const EMPTY_FORM = { name: '', color: 'blue', weekly_goal: 5 };

// ─── Fila de hábito ─────────────────────────────────────────────────────────────

function HabitRow({ h, onToggle, onEdit }) {
  const t = tone(h.color);
  const pct = Math.min(100, Math.round((h.week_count / h.weekly_goal) * 100));
  const met = h.week_count >= h.weekly_goal;

  return (
    <motion.div variants={staggerItem} layout className="flex items-center gap-3 px-4 py-3.5">
      {/* Tile con inicial */}
      <div className={`w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0 ${t.soft}`}>
        <span className={`text-[15px] font-bold ${t.text}`}>{h.name.charAt(0).toUpperCase()}</span>
      </div>

      {/* Nombre + progreso (tap = editar) */}
      <button onClick={() => onEdit(h)} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-ios-label font-medium truncate">{h.name}</span>
          {h.streak_weeks > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] font-semibold text-ios-orange">
              <Flame className="w-3 h-3" />{h.streak_weeks}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-ios-elev2 overflow-hidden max-w-[140px]">
            <div className={`h-full rounded-full ${met ? 'bg-ios-green' : t.bar}`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-[12px] font-mono ${met ? 'text-ios-green' : 'text-ios-label2'}`}>
            {h.week_count}/{h.weekly_goal}
          </span>
        </div>
      </button>

      {/* Check de hoy */}
      <button
        onClick={() => onToggle(h)}
        className="flex-shrink-0 active:scale-90 transition-transform"
        aria-label="Marcar hoy"
      >
        <span
          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
            h.done_today ? `${t.solid} border-transparent` : 'border-ios-label3'
          }`}
        >
          {h.done_today && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
        </span>
      </button>
    </motion.div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function HabitosPage() {
  const [habits, setHabits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);   // hábito en edición o null (nuevo)
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/habits');
      setHabits(data);
    } catch { setError('No se pudieron cargar los hábitos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Toggle optimista del check de hoy + ajuste del conteo semanal.
  const toggle = async (h) => {
    const nextDone = !h.done_today;
    setHabits((hs) => hs.map((x) => x.id === h.id
      ? { ...x, done_today: nextDone, week_count: Math.max(0, x.week_count + (nextDone ? 1 : -1)) }
      : x));
    try {
      await api.post(`/habits/${h.id}/toggle`);
    } catch {
      load(); // revertir desde el server si falla
    }
  };

  const openNew  = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (h) => { setEditing(h); setForm({ name: h.name, color: h.color, weekly_goal: h.weekly_goal }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) await api.patch(`/habits/${editing.id}`, form);
      else         await api.post('/habits', form);
      setModal(false);
      await load();
    } catch { /* no-op */ }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!editing) return;
    try {
      await api.delete(`/habits/${editing.id}`);
      setModal(false);
      setHabits((hs) => hs.filter((x) => x.id !== editing.id));
    } catch { /* no-op */ }
  };

  if (loading) return <PageLoader rows={4} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const doneToday = habits.filter((h) => h.done_today).length;
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <motion.div {...fadeUp} className="min-h-full pb-6">
      {/* Large Title header */}
      <header className="sticky top-0 z-10 bg-ios-bg/80 backdrop-blur-xl px-5 pt-7 pb-4 border-b border-ios-sep flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ios-label leading-none">Hábitos</h1>
          <p className="text-[15px] text-ios-label2 mt-1.5 capitalize">{hoy}</p>
        </div>
        <button
          onClick={openNew}
          className="w-9 h-9 rounded-full bg-ios-blue flex items-center justify-center active:opacity-70"
          aria-label="Nuevo hábito"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
        </button>
      </header>

      <div className="px-4 pt-5">
        {habits.length === 0 ? (
          <EmptyState
            icon={Check}
            title="Sin hábitos aún"
            description="Crea tu primer hábito (Gym, Box, agua, leer…) y marca cada día que lo cumplas."
            action={<Button onClick={openNew} variant="secondary" size="sm"><Plus className="w-3.5 h-3.5" />Nuevo hábito</Button>}
          />
        ) : (
          <>
            <p className="text-[13px] text-ios-label2 px-1 mb-2">
              {doneToday} de {habits.length} hechos hoy
            </p>
            <motion.div
              variants={staggerContainer} initial="initial" animate="animate"
              className="bg-ios-elev rounded-ios-lg overflow-hidden divide-y divide-ios-sep"
            >
              {habits.map((h) => (
                <HabitRow key={h.id} h={h} onToggle={toggle} onEdit={openEdit} />
              ))}
            </motion.div>
          </>
        )}
      </div>

      {/* Modal crear / editar */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar hábito' : 'Nuevo hábito'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Gym, Box, Agua, Leer…"
            autoFocus
            required
          />

          {/* Color */}
          <div>
            <label className="text-[13px] font-medium text-ios-label2 px-1">Color</label>
            <div className="flex flex-wrap gap-2.5 mt-2 px-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full ${tone(c).solid} transition-transform ${
                    form.color === c ? 'ring-2 ring-offset-2 ring-offset-ios-elev ring-white scale-110' : ''
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Meta semanal */}
          <div>
            <label className="text-[13px] font-medium text-ios-label2 px-1">Meta semanal (días)</label>
            <div className="flex gap-1.5 mt-2 px-1">
              {[1,2,3,4,5,6,7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, weekly_goal: n }))}
                  className={`flex-1 h-10 rounded-[10px] text-[15px] font-semibold transition-colors ${
                    form.weekly_goal === n ? 'bg-ios-blue text-white' : 'bg-ios-elev2 text-ios-label2'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando…' : editing ? 'Guardar' : 'Crear hábito'}
            </Button>
            {editing && (
              <Button type="button" variant="destructive" onClick={handleDelete} aria-label="Eliminar">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
