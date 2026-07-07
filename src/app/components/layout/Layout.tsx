import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className='flex-1 p-5'>
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}