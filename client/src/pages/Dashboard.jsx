import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Bell, ChevronRight, Check,
  TrendingUp, TrendingDown, Building2, AlertCircle, Circle,
} from 'lucide-react';
import api from '../lib/api';
import PageLoader, { ErrorState } from '../components/ui/PageLoader';
import { PriorityDot, ProjectBadge } from '../components/ui/Badge';
import { fadeUp, staggerContainer, staggerItem } from '../lib/animations';

// ─── Utilidades ───────────────────────────────────────────────────────────────

function fmx(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function todayLabel() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatReminderDate(str) {
  if (!str) return null;
  const d = new Date(str);
  const isPast = d < new Date();
  return {
    label: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    isPast,
  };
}

// ─── Primitivos iOS (inset grouped list) ────────────────────────────────────────

// Encabezado de grupo: etiqueta pequeña en mayúsculas, como iOS Settings.
function GroupLabel({ children, action }) {
  return (
    <div className="flex items-end justify-between px-1 mb-2">
      <p className="text-[13px] font-semibold text-ios-label2 uppercase tracking-wide">{children}</p>
      {action}
    </div>
  );
}

// Tarjeta agrupada: fondo elevado, esquinas iOS, filas con separador hairline.
function InsetCard({ children, className = '' }) {
  return (
    <div className={`bg-ios-elev rounded-ios-lg overflow-hidden divide-y divide-ios-sep ${className}`}>
      {children}
    </div>
  );
}

// Icono en cuadro redondeado con color (estilo SF Symbol / iconos de iOS).
function IconTile({ icon: Icon, tone = 'blue' }) {
  const map = {
    blue:   'bg-ios-blue   text-white',
    green:  'bg-ios-green  text-white',
    red:    'bg-ios-red    text-white',
    orange: 'bg-ios-orange text-white',
    purple: 'bg-ios-purple text-white',
    gray:   'bg-ios-gray   text-white',
    teal:   'bg-ios-teal   text-black',
  };
  return (
    <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0 ${map[tone] || map.blue}`}>
      <Icon className="w-[17px] h-[17px]" strokeWidth={2.3} />
    </div>
  );
}

// Fila genérica de lista. Si `to`, es navegable y muestra chevron.
function Row({ icon, tone, label, sub, value, valueColor = 'text-ios-label', to, last }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
      {icon && <IconTile icon={icon} tone={tone} />}
      <div className="min-w-0 flex-1">
        <p className="text-[15px] text-ios-label leading-tight truncate">{label}</p>
        {sub && <p className="text-[13px] text-ios-label2 mt-0.5 truncate">{sub}</p>}
      </div>
      {value !== undefined && (
        <span className={`text-[15px] font-semibold font-mono ${valueColor}`}>{value}</span>
      )}
      {to && <ChevronRight className="w-4 h-4 text-ios-label3 flex-shrink-0" />}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block active:bg-ios-elev2 transition-colors">
        {inner}
      </Link>
    );
  }
  return inner;
}

// ─── Hero de balance (estilo app de finanzas) ───────────────────────────────────

function BalanceHero({ net, mrr, income, expenses, hasData }) {
  const netColor = !hasData ? 'text-ios-label3' : net > 0 ? 'text-ios-green' : net < 0 ? 'text-ios-red' : 'text-ios-label';
  return (
    <div className="bg-ios-elev rounded-ios-lg p-5">
      <div className="flex items-center gap-1.5 mb-1">
        <p className="text-[13px] text-ios-label2">Neto del mes</p>
        {hasData && net !== 0 && (
          net > 0
            ? <TrendingUp className="w-3.5 h-3.5 text-ios-green" />
            : <TrendingDown className="w-3.5 h-3.5 text-ios-red" />
        )}
      </div>
      <p className={`text-[40px] font-bold tracking-tight font-mono leading-none ${netColor}`}>
        {hasData ? fmx(net) : '—'}
      </p>

      <div className="grid grid-cols-3 gap-2 mt-5">
        {[
          { k: 'MRR',      v: mrr,      c: 'text-ios-blue' },
          { k: 'Ingresos', v: income,   c: 'text-ios-green' },
          { k: 'Gastos',   v: expenses, c: 'text-ios-red' },
        ].map(({ k, v, c }) => (
          <div key={k} className="bg-ios-elev2 rounded-ios px-3 py-2.5">
            <p className="text-[11px] text-ios-label2 uppercase tracking-wide">{k}</p>
            <p className={`text-[15px] font-semibold font-mono mt-1 ${v > 0 ? c : 'text-ios-label3'}`}>
              {v > 0 ? fmx(v) : '—'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Configuración por negocio ──────────────────────────────────────────────────

const HABIT_TONE = {
  blue: 'bg-ios-blue', green: 'bg-ios-green', orange: 'bg-ios-orange', red: 'bg-ios-red',
  purple: 'bg-ios-purple', teal: 'bg-ios-teal', pink: 'bg-ios-pink', yellow: 'bg-ios-yellow',
};

const BIZ_TONE = { emerald: 'green', blue: 'blue', amber: 'orange' };
const STATUS_CFG = {
  live:         { label: 'Live',   cls: 'bg-ios-green/15  text-ios-green'  },
  beta:         { label: 'Beta',   cls: 'bg-ios-blue/15   text-ios-blue'   },
  construccion: { label: 'Pronto', cls: 'bg-ios-orange/15 text-ios-orange' },
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/dashboard')
      .then((r) => {
        const d = r.data;
        if (!d || !Array.isArray(d.businesses)) setError('Respuesta inesperada del servidor');
        else setData(d);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err?.response?.data?.error;
        setError(typeof msg === 'string' ? msg : 'No se pudo cargar el dashboard');
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <PageLoader rows={4} />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const { businesses, urgent_todos, reminders_due, habits = [] } = data;

  const totalMRR      = businesses.reduce((s, b) => s + Number(b.mrr || 0), 0);
  const totalIncome   = businesses.reduce((s, b) => s + Number(b.income_month || 0), 0);
  const totalExpenses = businesses.reduce((s, b) => s + Number(b.expenses_month || 0), 0);
  const totalNet      = totalIncome - totalExpenses;
  const hasData       = totalIncome > 0 || totalExpenses > 0;

  const mesActual = new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  return (
    <motion.div {...fadeUp} className="min-h-full pb-16">
      {/* Large Title header (iOS) */}
      <header className="sticky top-0 z-10 bg-ios-bg/80 backdrop-blur-xl px-5 pt-7 pb-4 border-b border-ios-sep">
        <h1 className="text-[28px] font-bold tracking-tight text-ios-label leading-none">
          {greeting()}, Iván
        </h1>
        <p className="text-[15px] text-ios-label2 mt-1.5 capitalize">{todayLabel()}</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-5 space-y-7">

        {/* ── Negocios ── */}
        <section>
          <GroupLabel
            action={
              <Link to="/negocios" className="flex items-center gap-0.5 text-[13px] text-ios-blue font-medium">
                Ver todo <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            León Ventures · {mesActual}
          </GroupLabel>

          <BalanceHero
            net={totalNet} mrr={totalMRR} income={totalIncome} expenses={totalExpenses} hasData={hasData}
          />

          <motion.div
            variants={staggerContainer} initial="initial" animate="animate"
            className="mt-4"
          >
            <InsetCard>
              {businesses.map((b) => {
                const net = Number(b.income_month) - Number(b.expenses_month);
                const st  = STATUS_CFG[b.status] || STATUS_CFG.construccion;
                const netStr = (Number(b.income_month) > 0 || Number(b.expenses_month) > 0)
                  ? `${net >= 0 ? '+' : ''}${fmx(net)} neto`
                  : 'sin movimientos';
                return (
                  <motion.div key={b.id} variants={staggerItem}>
                    <Link to={`/negocios/${b.slug}`} className="block active:bg-ios-elev2 transition-colors">
                      <div className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
                        <IconTile icon={Building2} tone={BIZ_TONE[b.color] || 'blue'} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] text-ios-label font-medium truncate">{b.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${st.cls}`}>
                              {st.label}
                            </span>
                          </div>
                          <p className="text-[13px] text-ios-label2 mt-0.5 truncate">{netStr}</p>
                        </div>
                        <div className="text-right">
                          {Number(b.mrr) > 0 && (
                            <p className="text-[15px] font-semibold font-mono text-ios-blue leading-none">{fmx(b.mrr)}</p>
                          )}
                          {Number(b.mrr) > 0 && <p className="text-[11px] text-ios-label3 mt-0.5">MRR</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-ios-label3 flex-shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </InsetCard>
          </motion.div>
        </section>

        {/* ── Hábitos ── */}
        <section>
          <GroupLabel
            action={
              <Link to="/habitos" className="flex items-center gap-0.5 text-[13px] text-ios-blue font-medium">
                Ver todo <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            Hábitos de hoy
          </GroupLabel>
          <InsetCard>
            {habits.length === 0 ? (
              <Row icon={CheckCircle2} tone="green" label="Sin hábitos aún" valueColor="text-ios-label3" />
            ) : (
              habits.map((h) => {
                const met = h.week_count >= h.weekly_goal;
                return (
                  <Link key={h.id} to="/habitos" className="block active:bg-ios-elev2 transition-colors">
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                      <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center flex-shrink-0 ${HABIT_TONE[h.color] || HABIT_TONE.blue}`}>
                        <span className="text-[13px] font-bold text-white">{h.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-[15px] text-ios-label flex-1 truncate">{h.name}</span>
                      <span className={`text-[13px] font-mono ${met ? 'text-ios-green' : 'text-ios-label2'}`}>
                        {h.week_count}/{h.weekly_goal}
                      </span>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        h.done_today ? 'bg-ios-green' : 'border-2 border-ios-label3'
                      }`}>
                        {h.done_today && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </InsetCard>
        </section>

        {/* ── Tareas urgentes ── */}
        <section>
          <GroupLabel
            action={
              <Link to="/personal/pendientes" className="flex items-center gap-0.5 text-[13px] text-ios-blue font-medium">
                Ver todo <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            Urgente · alta prioridad
          </GroupLabel>
          <InsetCard>
            {urgent_todos.length === 0 ? (
              <Row icon={CheckCircle2} tone="green" label="Sin tareas urgentes" valueColor="text-ios-label3" />
            ) : (
              urgent_todos.map((t) => (
                <Link
                  key={t.id}
                  to={`/personal/pendientes?project=${t.project}`}
                  className="block active:bg-ios-elev2 transition-colors"
                >
                  <div className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                    <PriorityDot priority={t.priority} />
                    <span className="text-[15px] text-ios-label flex-1 truncate">{t.title}</span>
                    <ProjectBadge project={t.project} />
                    <ChevronRight className="w-4 h-4 text-ios-label3 flex-shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </InsetCard>
        </section>

        {/* ── Recordatorios ── */}
        <section>
          <GroupLabel
            action={
              <Link to="/personal/recordatorios" className="flex items-center gap-0.5 text-[13px] text-ios-blue font-medium">
                Ver todo <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            Recordatorios
          </GroupLabel>
          <InsetCard>
            {reminders_due.length === 0 ? (
              <Row icon={Bell} tone="gray" label="Sin recordatorios pendientes" valueColor="text-ios-label3" />
            ) : (
              reminders_due.map((r) => {
                const due = formatReminderDate(r.due_at);
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 min-h-[52px]">
                    {due?.isPast
                      ? <AlertCircle className="w-[18px] h-[18px] text-ios-red flex-shrink-0" />
                      : <Circle className="w-[18px] h-[18px] text-ios-label3 flex-shrink-0" />
                    }
                    <span className="text-[15px] text-ios-label flex-1 truncate">{r.title}</span>
                    {due && (
                      <span className={`text-[13px] flex-shrink-0 ${due.isPast ? 'text-ios-red' : 'text-ios-label2'}`}>
                        {due.label}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </InsetCard>
        </section>

      </div>
    </motion.div>
  );
}
