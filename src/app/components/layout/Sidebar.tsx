import { NavLink } from 'react-router';
import {
  HomeIcon,
  LayoutDashboard
} from 'lucide-react';
import { clsx } from 'clsx';

// The only thing you need to change is this below, just add new nav items and they will automatically be visible in menu
const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <LayoutDashboard size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">React Vite Template</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={clsx(isActive ? 'text-indigo-600' : 'text-slate-400')}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}