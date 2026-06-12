import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, LogOut, LayoutDashboard,
  CheckSquare, Dumbbell, Weight, Bell, TrendingUp, Home,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { staggerContainer, staggerItem } from '../lib/animations';
import api from '../lib/api';

const PERSONAL_NAV = {
  section: 'Personal',
  items: [
    { to: '/personal/pendientes',    label: 'Pendientes',    icon: CheckSquare },
    { to: '/personal/gym',           label: 'Gym',           icon: Dumbbell },
    { to: '/personal/box',           label: 'Box',           icon: Dumbbell },
    { to: '/personal/peso',          label: 'Peso',          icon: Weight },
    { to: '/personal/recordatorios', label: 'Recordatorios', icon: Bell },
  ],
};

const ICON_BY_COLOR = {
  emerald: TrendingUp,
  blue:    Briefcase,
  amber:   Briefcase,
};

// Item de navegación estilo iOS: seleccionado = fill azul de sistema.
function NavItem({ to, label, icon: Icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-[10px] text-[15px] transition-colors duration-150 ${
          isActive
            ? 'bg-ios-blue text-white font-semibold'
            : 'text-ios-label hover:bg-ios-elev2 font-medium'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {Icon && <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-ios-label2'}`} strokeWidth={2.2} />}
          <span className="truncate">{label}</span>
        </>
      )}
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
      items: [{ to: '/', label: 'Dashboard', icon: Home, end: true }],
    },
    {
      section: 'Negocios',
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
    <aside className="w-60 flex-shrink-0 bg-ios-elev/60 backdrop-blur-xl border-r border-ios-sep flex flex-col h-full">
      {/* Wordmark */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-ios-blue rounded-[9px] flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-[13px] text-white tracking-tight">SP</span>
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-ios-label tracking-tight leading-none">Superpanel</h1>
            <p className="text-[11px] text-ios-label2 mt-1">León Ventures</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-6">
        {nav.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[12px] font-semibold text-ios-label2 uppercase tracking-wide px-3 mb-1.5">
              {section}
            </p>
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
      <div className="p-3 border-t border-ios-sep space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 bg-ios-elev2 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-semibold text-ios-label">{initials}</span>
          </div>
          <span className="text-[13px] text-ios-label2 truncate">{user?.name}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-[10px] text-[15px] text-ios-red hover:bg-ios-elev2 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2.2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
