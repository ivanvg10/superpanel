import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import Pendientes    from './Pendientes';
import Gym           from './Gym';
import Box           from './Box';
import Recordatorios from './Recordatorios';

// Subsecciones de Personal. En móvil no hay sidebar, así que se navega con estos chips.
const SUB = [
  { to: 'pendientes',    label: 'Pendientes' },
  { to: 'gym',           label: 'Gym' },
  { to: 'box',           label: 'Box' },
  { to: 'recordatorios', label: 'Recordatorios' },
];

function SubNav() {
  return (
    <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-3 border-b border-ios-sep [&::-webkit-scrollbar]:hidden">
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
        <Route path="gym"           element={<Gym />} />
        <Route path="box"           element={<Box />} />
        <Route path="recordatorios" element={<Recordatorios />} />
        <Route path="*"             element={<Navigate to="pendientes" replace />} />
      </Routes>
    </div>
  );
}
