import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';

export default function Layout() {
  return (
    <div className="flex h-screen bg-ios-bg text-ios-label overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}
