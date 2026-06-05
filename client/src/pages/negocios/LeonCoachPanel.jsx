import { useState, useEffect } from 'react';
import { ClipboardList, TrendingUp, Users, CreditCard } from 'lucide-react';
import api from '../../lib/api';

// ── Utilidades ────────────────────────────────────────────────────────────────

const fmtFecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

// ── Sub-tab: Cuestionarios ────────────────────────────────────────────────────

function CuestionariosTab() {
  const [data, setData]       = useState(null);
  const [tipo, setTipo]       = useState('base');
  const [filtro, setFiltro]   = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [marcando, setMarcando] = useState(false);

  const cargar = () =>
    api.get('/leon-coach/cuestionarios').then(r => setData(r.data)).catch(() => {});

  useEffect(() => { cargar(); }, []);

  const marcar = async (id) => {
    setMarcando(id);
    await api.put(`/leon-coach/cuestionario-${tipo}/${id}/revisar`).catch(() => {});
    await cargar();
    if (detalle?.id === id) setDetalle(d => ({ ...d, revisado: true }));
    setMarcando(null);
  };

  if (!data) return <Spinner />;

  const lista = (tipo === 'base' ? data.base : data.pro) || [];
  const filtrada = lista
    .filter(c => filtro === 'todos' || (filtro === 'pendiente' ? !c.revisado : c.revisado))
    .filter(c => !busqueda || c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || c.usuario?.toLowerCase().includes(busqueda.toLowerCase()));

  if (detalle) return (
    <div>
      <button onClick={() => setDetalle(null)} className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 flex items-center gap-1 transition-colors">
        ← Cuestionarios
      </button>
      <div className="mb-5">
        <p className="text-lg font-bold text-zinc-50">{detalle.nombre}</p>
        <p className="text-sm text-zinc-500 mt-0.5">@{detalle.usuario} · {detalle.plan}</p>
        <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${detalle.revisado ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
          {detalle.revisado ? '✓ Revisado' : '⏳ Pendiente'}
        </span>
      </div>

      {!detalle.revisado && (
        <button
          onClick={() => marcar(detalle.id)}
          disabled={!!marcando}
          className="mb-5 w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          {marcando === detalle.id ? 'Marcando…' : '✓ Marcar como revisado'}
        </button>
      )}

      <DetalleFields item={detalle} tipo={tipo} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex rounded-xl border border-zinc-800 overflow-hidden">
          {['base', 'pro'].map(t => (
            <button key={t} onClick={() => setTipo(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tipo === t ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60'}`}>
              {t === 'base' ? `Base (${data.base?.length || 0})` : `Pro (${data.pro?.length || 0})`}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {[['todos', 'Todos'], ['pendiente', 'Pendientes'], ['revisado', 'Revisados']].map(([id, label]) => (
            <button key={id} onClick={() => setFiltro(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filtro === id ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-300' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <input
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        placeholder="Buscar cliente…"
        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-10 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 placeholder-zinc-600 transition-all"
      />

      {filtrada.length === 0 && (
        <p className="text-sm text-zinc-600 py-6 text-center">Sin resultados</p>
      )}

      <div className="space-y-2">
        {filtrada.map(c => (
          <button key={c.id} onClick={() => setDetalle(c)}
            className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-all">
            <div>
              <p className="text-sm font-semibold text-zinc-200">{c.nombre}</p>
              <p className="text-xs text-zinc-500 mt-0.5">@{c.usuario} · {fmtFecha(c.creado_en)}</p>
            </div>
            <span className={`text-xs font-bold flex-shrink-0 ${c.revisado ? 'text-emerald-400' : 'text-amber-400'}`}>
              {c.revisado ? '✓' : '⏳'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DetalleFields({ item: i, tipo }) {
  const Row = ({ label, valor }) => {
    if (!valor && valor !== false && valor !== 0) return null;
    const txt = Array.isArray(valor) ? valor.join(', ') : String(valor);
    if (!txt || txt === 'null' || txt === 'false') return null;
    return (
      <div>
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm text-zinc-300">{txt}</p>
      </div>
    );
  };

  if (tipo === 'base') return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      <Row label="Peso"                    valor={i.peso     ? `${i.peso} kg`   : null} />
      <Row label="Altura"                  valor={i.altura   ? `${i.altura} cm` : null} />
      <Row label="Nacimiento"              valor={i.fecha_nacimiento} />
      <Row label="Nivel real"              valor={i.nivel_real} />
      <Row label="Tiempo entrenando"       valor={i.tiempo_entrenando} />
      <Row label="Gym"                     valor={i.nombre_gym} />
      <Row label="Entrena actualmente"     valor={i.entrena_actualmente ? 'Sí' : 'No'} />
      <Row label="Descripción"             valor={i.descripcion_entrenamiento} />
      <Row label="Lesiones"                valor={i.lesiones} />
      <Row label="No le gustan"            valor={i.ejercicios_no_gustan} />
      <Row label="Bajo estímulo"           valor={i.ejercicios_baja_estimulo} />
      <Row label="Músculos prioritarios"   valor={i.musculos_prioritarios} />
      <Row label="Puede fondos"            valor={i.puede_fondos} />
      <Row label="Puede dominadas"         valor={i.puede_dominadas} />
      <Row label="Notas"                   valor={i.notas_libres} />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <Row label="Peso"             valor={i.peso   ? `${i.peso} kg`   : null} />
        <Row label="Altura"           valor={i.altura ? `${i.altura} cm` : null} />
        <Row label="Edad"             valor={i.edad} />
        <Row label="Sexo"             valor={i.sexo} />
        <Row label="Objetivo macros"  valor={i.objetivo_macros} />
        <Row label="Nivel actividad"  valor={i.nivel_actividad} />
      </div>
      <div className="grid grid-cols-4 gap-3 mt-4">
        {[['Proteína', i.proteina_g, 'g'], ['Carbs', i.carbs_g, 'g'], ['Grasa', i.grasa_g, 'g'], ['Calorías', i.calorias, 'kcal']].map(([l, v, u]) => v && (
          <div key={l} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-xs text-zinc-600 mb-1">{l}</p>
            <p className="text-xl font-black text-amber-400">{v}</p>
            <p className="text-[10px] text-zinc-600">{u}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sub-tab: Embudo ───────────────────────────────────────────────────────────

function EmbudoTab() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/leon-coach/funnel').then(r => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <Spinner />;

  const conv    = pct(data.planes_pago?.reduce((a, p) => a + parseInt(p.count), 0), data.total);
  const onbPct  = pct(data.onboarding, data.total);
  const cuestPct = pct(data.con_cuestionario, data.total);
  const maxReg  = Math.max(...(data.por_mes?.map(m => parseInt(m.registros)) || [1]));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Registrados',           valor: data.total,            sub: 'total'              },
          { label: 'Onboarding completado', valor: data.onboarding,       sub: `${onbPct}%`         },
          { label: 'Con cuestionario',      valor: data.con_cuestionario, sub: `${cuestPct}%`       },
          { label: 'Tasa de conversión',    valor: `${conv}%`,            sub: 'a plan de pago'     },
        ].map(({ label, valor, sub }) => (
          <div key={label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-[11px] text-zinc-600 uppercase tracking-wide mb-2">{label}</p>
            <p className="text-2xl font-black text-amber-400">{valor}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {data.planes_pago?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Clientes por plan de pago</p>
          <div className="flex gap-3 flex-wrap">
            {data.planes_pago.map(p => (
              <div key={p.plan} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center min-w-[90px]">
                <p className="text-xl font-black text-amber-400">{p.count}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{p.plan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.por_mes?.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Registros por mes (últimos 6 meses)</p>
          <div className="flex items-end gap-2 h-20">
            {data.por_mes.map(m => {
              const h = maxReg > 0 ? Math.round((parseInt(m.registros) / maxReg) * 60) : 4;
              return (
                <div key={m.mes} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-zinc-600">{m.registros}</span>
                  <div className="w-full rounded-sm bg-amber-400/80 min-h-[4px]" style={{ height: h }} />
                  <span className="text-[9px] text-zinc-600 whitespace-nowrap">{m.mes.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-tab: Clientes ─────────────────────────────────────────────────────────

function ClientesTab() {
  const [clientes, setClientes] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    api.get('/leon-coach/clientes').then(r => setClientes(r.data.clientes || [])).catch(() => {});

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    setGuardando(true);
    await api.put(`/leon-coach/clientes/${editando}`, editForm).catch(() => {});
    await cargar();
    setEditando(null); setEditForm({});
    setGuardando(false);
  };

  if (!clientes) return <Spinner />;

  const filtrados = clientes.filter(c =>
    !busqueda ||
    c.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.usuario?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar cliente…"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-10 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 placeholder-zinc-600 transition-all"
        />
        <span className="ml-3 text-xs text-zinc-600 flex-shrink-0">{filtrados.length} clientes</span>
      </div>

      {filtrados.map(c => (
        <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200">{c.nombre}</p>
              <p className="text-xs text-zinc-500 mt-0.5">@{c.usuario} · {c.email || 'sin email'}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.plan === 'gratuito' ? 'border-zinc-800 text-zinc-600' : 'border-amber-500/40 bg-amber-500/10 text-amber-400'}`}>
                  {c.plan}
                </span>
                {c.tiene_cuestionario_base && <span className="text-[10px] text-emerald-400">✓ C. Base</span>}
                {c.tiene_cuestionario_pro  && <span className="text-[10px] text-emerald-400">✓ C. Pro</span>}
              </div>
              <p className="text-xs text-zinc-600 mt-1.5">
                Desde {fmtFecha(c.fecha_inicio)}
                {c.ultima_sesion && ` · Sesión: ${fmtFecha(c.ultima_sesion)}`}
                {c.dias != null && ` · ${c.dias}d vence`}
              </p>
              {c.ultima_nota && (
                <p className="text-xs text-zinc-500 mt-1 italic">📝 {c.ultima_nota}</p>
              )}
            </div>
            <button
              onClick={() => { setEditando(c.usuario); setEditForm({ plan: c.plan, fecha_vence: c.fecha_vence?.slice(0, 10) || '', nota: '' }); }}
              className="flex-shrink-0 text-xs text-zinc-500 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              Editar
            </button>
          </div>

          {editando === c.usuario && (
            <div className="pt-3 border-t border-zinc-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Plan</label>
                  <select
                    value={editForm.plan}
                    onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-sm px-3 h-9 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  >
                    {['gratuito', 'Base', 'Pro'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Fecha vence</label>
                  <input
                    type="date"
                    value={editForm.fecha_vence}
                    onChange={e => setEditForm(f => ({ ...f, fecha_vence: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-sm px-3 h-9 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>
              <input
                value={editForm.nota}
                onChange={e => setEditForm(f => ({ ...f, nota: e.target.value }))}
                placeholder="Nota interna…"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 h-9 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-500/40 placeholder-zinc-600 transition-all"
              />
              <div className="flex gap-2">
                <button onClick={guardar} disabled={guardando}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
                <button onClick={() => { setEditando(null); setEditForm({}); }}
                  className="text-sm text-zinc-500 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Sub-tab: Planes ───────────────────────────────────────────────────────────

function PlanesTab() {
  const [planes, setPlanes] = useState(null);
  useEffect(() => { api.get('/leon-coach/planes').then(r => setPlanes(r.data.planes || [])).catch(() => {}); }, []);
  if (!planes) return <Spinner />;

  const grupos = [
    { nombre: 'Base', items: planes.filter(p => p.clave.startsWith('base')) },
    { nombre: 'Pro',  items: planes.filter(p => p.clave.startsWith('pro'))  },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
        <span className="text-amber-400 text-sm">⚠️</span>
        <p className="text-xs text-zinc-500">
          Precios de Stripe — <span className="font-semibold text-zinc-400">solo lectura</span>. Para cambiar price_ids, actualiza las variables de entorno en Railway y el producto en Stripe.
        </p>
      </div>

      {grupos.map(g => (
        <div key={g.nombre}>
          <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">{g.nombre}</p>
          <div className="grid grid-cols-2 gap-3">
            {g.items.map(plan => (
              <div key={plan.clave} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm font-semibold text-zinc-200 mb-1">{plan.nombre}</p>
                <p className="text-xl font-black text-amber-400">{plan.precio}</p>
                <p className="text-xs text-zinc-600 mb-3">{plan.periodo}</p>
                <p className="font-mono text-[11px] text-zinc-700 bg-black/40 px-2 py-1.5 rounded-lg truncate">
                  {plan.price_id || 'No configurado'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-indigo-500 animate-spin" />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

const TABS = [
  { id: 'cuestionarios', label: 'Cuestionarios', Icon: ClipboardList },
  { id: 'funnel',        label: 'Embudo',         Icon: TrendingUp   },
  { id: 'clientes',      label: 'Clientes',        Icon: Users        },
  { id: 'planes',        label: 'Planes',          Icon: CreditCard   },
];

export default function LeonCoachPanel() {
  const [tab, setTab] = useState('cuestionarios');

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-800">
        <span className="text-base">⚡</span>
        <span className="text-sm font-semibold text-zinc-300">Operación León Coach</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 flex-shrink-0 px-5 py-3.5 text-sm font-medium transition-all border-b-2 ${
              tab === id
                ? 'border-indigo-500 text-indigo-300'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="p-5">
        {tab === 'cuestionarios' && <CuestionariosTab />}
        {tab === 'funnel'        && <EmbudoTab />}
        {tab === 'clientes'      && <ClientesTab />}
        {tab === 'planes'        && <PlanesTab />}
      </div>
    </div>
  );
}
