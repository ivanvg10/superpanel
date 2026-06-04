import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, User, LogOut, LayoutDashboard,
  CheckSquare, Dumbbell, Weight, Leaf, Bell, TrendingUp, Home,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { staggerContainer, staggerItem } from '../lib/animations';
import api from '../lib/api';

const PERSONAL_NAV = {
  section: 'Personal',
  icon: User,
  items: [
    { to: '/personal/pendientes',    label: 'Pendientes',    icon: CheckSquare },
    { to: '/personal/gym',           label: 'Gym',           icon: Dumbbell },
    { to: '/personal/box',           label: 'Box',           icon: Dumbbell },
    { to: '/personal/peso',          label: 'Peso',          icon: Weight },
    { to: '/personal/cannabis',      label: 'Cannabis',      icon: Leaf },
    { to: '/personal/recordatorios', label: 'Recordatorios', icon: Bell },
  ],
};

const ICON_BY_COLOR = {
  emerald: TrendingUp,
  blue:    Briefcase,
  amber:   Briefcase,
};

function NavItem({ to, label, icon: Icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 border ${
          isActive
            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 border-transparent'
        }`
      }
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [businesses, setBusinesses] = useState([]);

  useEffect(() => {
    const refresh = () => {
      api.get('/negocios').then(({ data }) => setBusinesses(data)).catch(() => {});
    };
    refresh();
    window.addEventListener('negocios-updated', refresh);
    return () => window.removeEventListener('negocios-updated', refresh);
  }, []);

  const nav = [
    {
      section: 'Inicio',
      icon: Home,
      items: [{ to: '/', label: 'Dashboard', icon: Home, end: true }],
    },
    {
      section: 'Negocios',
      icon: Briefcase,
      items: [
        { to: '/negocios', label: 'Vista General', icon: LayoutDashboard, end: true },
        ...businesses.map((b) => ({
          to: `/negocios/${b.slug}`,
          label: b.name,
          icon: ICON_BY_COLOR[b.color] || Briefcase,
        })),
      ],
    },
    PERSONAL_NAV,
  ];

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'SU';

  return (
    <aside className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-indigo-600/15 border border-indigo-500/25 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-[11px] text-indigo-400 tracking-tight">SP</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">Superpanel</h1>
            <p className="text-[10px] text-zinc-600 mt-0.5">León Ventures</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {nav.map(({ section, icon: SectionIcon, items }) => (
          <div key={section}>
            <div className="flex items-center gap-2 px-3 mb-2">
              <SectionIcon className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                {section}
              </span>
            </div>
            <motion.div
              className="space-y-0.5"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {items.map((item) => (
                <motion.div key={item.to} variants={staggerItem}>
                  <NavItem {...item} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </nav>

      {/* Usuario + Logout */}
      <div className="p-3 border-t border-zinc-800 space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-6 h-6 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-semibold text-zinc-300">{initials}</span>
          </div>
          <span className="text-xs text-zinc-500 truncate">{user?.name}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/70 transition-colors border border-transparent"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
