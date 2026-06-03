import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, CheckCheck, Pencil, Trash2, Circle } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { ProjectBadge, PriorityDot, PriorityBadge } from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader, { ErrorState } from '../../components/ui/PageLoader';
import { fadeUp, staggerContainer, staggerItem } from '../../lib/animations';

const PROJECTS = [
  { id: 'all',        label: 'Todos' },
  { id: 'chai-fit',   label: 'Chai Fit' },
  { id: 'leon-coach', label: 'León Coach' },
  { id: 'san-charly', label: 'San Charly' },
  { id: 'personal',   label: 'Personal' },
];

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'];

const EMPTY_FORM = {
  title: '', description: '', project: 'personal',
  priority: 'medium', due_date: '',
};

function formatDate(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  if (d < today) return { label: 'Vencida', cls: 'text-red-400' };
  if (d.getTime() === today.getTime()) return { label: 'Hoy', cls: 'text-orange-400' };
  const diff = Math.round((d - today) / 86400000);
  if (diff === 1) return { label: 'Mañana', cls: 'text-yellow-400' };
  return {
    label: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
    cls: 'text-zinc-500',
  };
}

function TodoCard({ todo, onToggle, onEdit, onDelete }) {
  const date = formatDate(todo.due_date);
  const done = todo.status === 'done';

  return (
    <motion.div
      layout
      {...staggerItem}
      className={`group flex items-start gap-3 p-4 rounded-xl border transition-all duration-200
        ${done
          ? 'bg-zinc-900/40 border-zinc-800/50 opacity-60'
          : 'bg-zinc-900 border-zinc-800 shadow-card hover:border-zinc-700 hover:shadow-card-hover'
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo)}
        className="mt-0.5 flex-shrink-0 text-zinc-600 hover:text-indigo-400 transition-colors"
      >
        {done
          ? <CheckCheck className="w-4.5 h-4.5 text-indigo-500" />
          : <Circle className="w-4.5 h-4.5" />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${done ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{todo.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <ProjectBadge project={todo.project} />
          {date && <span className={`text-xs font-medium ${date.cls}`}>{date.label}</span>}
        </div>
      </div>

      {/* Priority dot + Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <PriorityDot priority={todo.priority} className="mr-1" />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          <button
            onClick={() => onEdit(todo)}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TodoForm({ form, setForm, onSubmit, onClose, loading, editId }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Título"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="¿Qué hay que hacer?"
        required
        autoFocus
      />
      <Input
        label="Descripción (opcional)"
        as="textarea"
        rows={2}
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Detalles adicionales…"
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Proyecto</label>
          <select
            value={form.project}
            onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-sm px-3.5 h-10 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 hover:border-zinc-700 transition-all"
          >
            <option value="personal">Personal</option>
            <option value="chai-fit">Chai Fit</option>
            <option value="leon-coach">León Coach</option>
            <option value="san-charly">San Charly</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Prioridad</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-sm px-3.5 h-10 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 hover:border-zinc-700 transition-all"
          >
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>
      <Input
        label="Fecha límite (opcional)"
        type="date"
        value={form.due_date}
        onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
        className="[color-scheme:dark]"
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Guardando…' : editId ? 'Guardar cambios' : 'Crear tarea'}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function Pendientes() {
  const [searchParams]          = useSearchParams();
  const [todos, setTodos]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  // Permite pre-filtrar desde ?project=chai-fit (enlace desde tarjeta de negocio)
  const [project, setProject]   = useState(searchParams.get('project') || 'all');
  const [showDone, setShowDone] = useState(false);
  const [modal, setModal]       = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get('/personal/todos');
      setTodos(data);
    } catch { setError('No se pudieron cargar las tareas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = todos.filter((t) =>
    (project === 'all' || t.project === project)
  );
  const pending = filtered.filter((t) => t.status !== 'done');
  const done    = filtered.filter((t) => t.status === 'done');

  // Group pending by priority
  const grouped = PRIORITY_ORDER.reduce((acc, p) => {
    const items = pending.filter((t) => t.priority === p);
    if (items.length) acc[p] = items;
    return acc;
  }, {});

  const openAdd = () => { setEditId(null); setForm(EMPTY_FORM); setModal(true); };
  const openEdit = (todo) => {
    setEditId(todo.id);
    setForm({
      title: todo.title,
      description: todo.description || '',
      project: todo.project,
      priority: todo.priority,
      due_date: todo.due_date ? todo.due_date.split('T')[0] : '',
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        const { data } = await api.patch(`/personal/todos/${editId}`, form);
        setTodos((ts) => ts.map((t) => t.id === editId ? data : t));
      } else {
        const { data } = await api.post('/personal/todos', form);
        setTodos((ts) => [data, ...ts]);
      }
      setModal(false);
    } catch { /* no-op */ }
    finally { setSaving(false); }
  };

  const handleToggle = async (todo) => {
    const newStatus = todo.status === 'done' ? 'pending' : 'done';
    try {
      const { data } = await api.patch(`/personal/todos/${todo.id}`, { status: newStatus });
      setTodos((ts) => ts.map((t) => t.id === todo.id ? data : t));
    } catch { /* no-op */ }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/personal/todos/${id}`);
      setTodos((ts) => ts.filter((t) => t.id !== id));
    } catch { /* no-op */ }
  };

  const PRIORITY_LABELS = { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' };
  const PRIORITY_COLORS = {
    urgent: 'text-red-400', high: 'text-orange-400',
    medium: 'text-yellow-400', low: 'text-zinc-500',
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  return (
    <motion.div {...fadeUp} className="min-h-full">
      {/* Page header */}
      <div className="border-b border-zinc-800 px-8 py-6 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-10">
        <div>
          <h2 className="font-display text-xl font-bold text-zinc-50">Pendientes</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {pending.length} pendiente{pending.length !== 1 ? 's' : ''} · {done.length} completada{done.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openAdd} size="md">
          <Plus className="w-4 h-4" />
          Nueva tarea
        </Button>
      </div>

      <div className="px-8 py-6">
        {/* Project filter */}
        <div className="flex gap-1.5 flex-wrap mb-6">
          {PROJECTS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProject(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${
                project === p.id
                  ? 'bg-indigo-600 text-white shadow-glow-sm'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {pending.length === 0 && done.length === 0 && (
          <EmptyState
            icon={CheckSquare}
            title="Sin tareas pendientes"
            description="Estás al día. Añade una nueva tarea cuando la necesites."
            action={<Button onClick={openAdd} variant="secondary" size="sm"><Plus className="w-3.5 h-3.5" />Nueva tarea</Button>}
          />
        )}

        {/* Grouped by priority */}
        {Object.entries(grouped).map(([priority, items]) => (
          <motion.section key={priority} {...staggerContainer} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <PriorityDot priority={priority} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${PRIORITY_COLORS[priority]}`}>
                {PRIORITY_LABELS[priority]}
              </span>
              <span className="text-xs text-zinc-700 font-mono">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </motion.section>
        ))}

        {/* Completed section */}
        {done.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowDone((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium text-zinc-600 hover:text-zinc-400 transition-colors mb-3"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Completadas ({done.length})
              <span className="text-zinc-700">{showDone ? '↑' : '↓'}</span>
            </button>
            <AnimatePresence>
              {showDone && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {done.map((todo) => (
                    <TodoCard
                      key={todo.id}
                      todo={todo}
                      onToggle={handleToggle}
                      onEdit={openEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editId ? 'Editar tarea' : 'Nueva tarea'}
      >
        <TodoForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          onClose={() => setModal(false)}
          loading={saving}
          editId={editId}
        />
      </Modal>
    </motion.div>
  );
}
