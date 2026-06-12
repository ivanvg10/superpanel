import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bell, Check, Trash2, BellOff, CalendarClock } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader, { ErrorState } from '../../components/ui/PageLoader';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';

function formatDue(str) {
  if (!str) return null;
  const d = new Date(str);
  const now = new Date();
  const isPast = d < now;
  const label = d.toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
  return { label, isPast };
}

function ReminderCard({ reminder, onToggle, onDelete }) {
  const due = formatDue(reminder.due_at);
  const done = reminder.is_done;

  return (
    <motion.div
      layout
      {...staggerItem}
      className={`group flex items-start gap-3 p-4 rounded-ios border transition-all duration-200
        ${done
          ? 'bg-ios-elev/30 border-ios-sep/40 opacity-50'
          : 'bg-ios-elev border-ios-sep shadow-card hover:border-ios-sep hover:shadow-card-hover'
        }`}
    >
      {/* Status toggle */}
      <button
        onClick={() => onToggle(reminder)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200
          ${done
            ? 'bg-ios-blue border-ios-blue text-white'
            : 'border-ios-label3 hover:border-ios-blue hover:bg-ios-blue/10'
          }`}
      >
        {done && <Check className="w-2.5 h-2.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${done ? 'line-through text-ios-label0' : 'text-ios-label'}`}>
          {reminder.title}
        </p>
        {reminder.description && (
          <p className="text-xs text-ios-label3 mt-1 line-clamp-2">{reminder.description}</p>
        )}
        {due && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            done ? 'text-ios-label3' : due.isPast ? 'text-ios-red' : 'text-ios-label0'
          }`}>
            <CalendarClock className="w-3 h-3" />
            {due.isPast && !done ? 'Vencido · ' : ''}{due.label}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={() => onDelete(reminder.id)}
          className="p-1.5 rounded-lg text-ios-label3 hover:text-ios-red hover:bg-ios-red/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

const EMPTY_FORM = { title: '', description: '', due_at: '' };

export default function Recordatorios() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [showDone, setShowDone]   = useState(false);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/personal/reminders');
      setReminders(data);
    } catch { setError('No se pudieron cargar los recordatorios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const pending = reminders.filter((r) => !r.is_done);
  const done    = reminders.filter((r) => r.is_done);

  // Overdue first, then by due_at
  const sorted = [...pending].sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at) - new Date(b.due_at);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/personal/reminders', {
        title: form.title,
        description: form.description || null,
        due_at: form.due_at || null,
      });
      setReminders((rs) => [data, ...rs]);
      setModal(false);
      setForm(EMPTY_FORM);
    } catch { /* no-op */ }
    finally { setSaving(false); }
  };

  const handleToggle = async (reminder) => {
    try {
      const { data } = await api.patch(`/personal/reminders/${reminder.id}`, {
        is_done: !reminder.is_done,
      });
      setReminders((rs) => rs.map((r) => r.id === reminder.id ? data : r));
    } catch { /* no-op */ }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/personal/reminders/${id}`);
      setReminders((rs) => rs.filter((r) => r.id !== id));
    } catch { /* no-op */ }
  };

  if (loading) return <PageLoader rows={4} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const overdueCount = sorted.filter((r) => r.due_at && new Date(r.due_at) < new Date()).length;

  return (
    <motion.div {...fadeUp} className="min-h-full">
      <div className="border-b border-ios-sep px-5 pt-7 pb-4 flex items-center justify-between sticky top-0 bg-ios-bg/80 backdrop-blur-xl z-10">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-ios-label">Recordatorios</h2>
          <p className="text-sm mt-0.5">
            <span className="text-ios-label0">{pending.length} pendiente{pending.length !== 1 ? 's' : ''}</span>
            {overdueCount > 0 && (
              <span className="text-ios-red ml-2">· {overdueCount} vencido{overdueCount !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setModal(true); }}>
          <Plus className="w-4 h-4" />
          Nuevo recordatorio
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {reminders.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Sin recordatorios"
            description="Crea recordatorios con fecha y hora para no olvidar nada importante."
            action={
              <Button onClick={() => setModal(true)} variant="secondary" size="sm">
                <Plus className="w-3.5 h-3.5" />Nuevo recordatorio
              </Button>
            }
          />
        ) : (
          <>
            {sorted.length === 0 && done.length > 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="w-12 h-12 bg-ios-green/10 border border-ios-green/20 rounded-ios-lg flex items-center justify-center mb-3">
                  <Check className="w-5 h-5 text-ios-green" />
                </div>
                <p className="text-sm font-medium text-ios-label2">Todo al día</p>
                <p className="text-xs text-ios-label3 mt-1">No tienes recordatorios pendientes</p>
              </div>
            )}

            {sorted.length > 0 && (
              <motion.div {...staggerContainer} className="space-y-2 mb-6">
                {sorted.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </motion.div>
            )}

            {done.length > 0 && (
              <div>
                <button
                  onClick={() => setShowDone((v) => !v)}
                  className="flex items-center gap-2 text-xs font-medium text-ios-label3 hover:text-ios-label2 transition-colors mb-3"
                >
                  <BellOff className="w-3.5 h-3.5" />
                  Completados ({done.length})
                  <span className="text-ios-label3">{showDone ? '↑' : '↓'}</span>
                </button>
                <AnimatePresence>
                  {showDone && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      {done.map((r) => (
                        <ReminderCard
                          key={r.id}
                          reminder={r}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nuevo recordatorio">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="¿Qué necesitas recordar?"
            required autoFocus
          />
          <Input
            label="Descripción (opcional)"
            as="textarea" rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Detalles adicionales…"
          />
          <Input
            label="Fecha y hora (opcional)"
            type="datetime-local"
            value={form.due_at}
            onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value }))}
            className="[color-scheme:dark]"
          />
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Guardando…' : 'Crear recordatorio'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
