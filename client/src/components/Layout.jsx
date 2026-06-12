import { Outlet } from 'react-router-dom';
import BottomTabBar from './BottomTabBar';

// "Phone-shell": la app vive siempre como un teléfono. En el celular ocupa toda
// la pantalla; en escritorio queda centrada con ancho de teléfono (el desktop
// no es prioridad). El scroll vive dentro de <main>; header y tab bar son fijos.
export default function Layout() {
  return (
    <div
      className="h-[100dvh] w-full bg-ios-bg flex justify-center overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="w-full max-w-[440px] h-full flex flex-col bg-ios-bg relative overflow-hidden">
        <main className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <Outlet />
        </main>
        <BottomTabBar />
      </div>
    </div>
  );
}
