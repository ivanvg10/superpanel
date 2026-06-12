import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Pendientes    from './Pendientes';
import Recordatorios from './Recordatorios';

// Subsecciones navegables por chips (la app no tiene sidebar).
const SUB = [
  { to: 'pendientes',    label: 'Pendientes' },
  { to: 'recordatorios', label: 'Recordatorios' },
];

function SubNav() {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-ios-sep [&::-webkit-scrollbar]:hidden">
      {SUB.map((s) => (
        <NavLink
          key={s.to}
          to={s.to}
          className={({ isActive }) =>
            `px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
              isActive ? 'bg-ios-blue text-white' : 'bg-ios-elev2 text-ios-label2'
            }`
          }
        >
          {s.label}
        </NavLink>
      ))}
    </div>
  );
}

export default function PersonalPage() {
  return (
    <div>
      <SubNav />
      <Routes>
        <Route index                element={<Navigate to="pendientes" replace />} />
        <Route path="pendientes"    element={<Pendientes />} />
        <Route path="recordatorios" element={<Recordatorios />} />
        <Route path="*"             element={<Navigate to="pendientes" replace />} />
      </Routes>
    </div>
  );
}
