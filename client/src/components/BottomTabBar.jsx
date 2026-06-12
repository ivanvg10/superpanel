import { NavLink, useLocation } from 'react-router-dom';
import { Home, Briefcase, User } from 'lucide-react';

// Tab bar inferior estilo iOS — solo en móvil (en desktop manda el Sidebar).
const TABS = [
  { to: '/',                     label: 'Inicio',   icon: Home,      match: '/',          exact: true },
  { to: '/negocios',             label: 'Negocios', icon: Briefcase, match: '/negocios' },
  { to: '/personal/pendientes',  label: 'Personal', icon: User,      match: '/personal' },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();

  const isActive = (t) => (t.exact ? pathname === t.match : pathname.startsWith(t.match));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-ios-elev/85 backdrop-blur-xl border-t border-ios-sep pb-[env(safe-area-inset-bottom)]">
      <div className="flex">
        {TABS.map((t) => {
          const active = isActive(t);
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-2 pb-1.5 select-none"
            >
              <Icon
                className={`w-[26px] h-[26px] ${active ? 'text-ios-blue' : 'text-ios-label2'}`}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className={`text-[10px] font-medium ${active ? 'text-ios-blue' : 'text-ios-label2'}`}>
                {t.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
