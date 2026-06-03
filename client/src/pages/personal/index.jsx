import { Routes, Route, Navigate } from 'react-router-dom';
import Pendientes    from './Pendientes';
import Gym           from './Gym';
import Box           from './Box';
import Peso          from './Peso';
import Cannabis      from './Cannabis';
import Recordatorios from './Recordatorios';

export default function PersonalPage() {
  return (
    <Routes>
      <Route index                   element={<Navigate to="pendientes" replace />} />
      <Route path="pendientes"       element={<Pendientes />} />
      <Route path="gym"              element={<Gym />} />
      <Route path="box"              element={<Box />} />
      <Route path="peso"             element={<Peso />} />
      <Route path="cannabis"         element={<Cannabis />} />
      <Route path="recordatorios"    element={<Recordatorios />} />
      <Route path="*"                element={<Navigate to="pendientes" replace />} />
    </Routes>
  );
}
