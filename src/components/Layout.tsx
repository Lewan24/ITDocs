import { useState } from 'react'
import {
  Shield, LayoutDashboard, Server, KeyRound, FileText,
  Network, CreditCard, Settings, ChevronLeft, ChevronRight,
  Search, Bell, User, LogOut, ChevronDown, X,
} from 'lucide-react'
import type { View } from '../App'

interface NavItem {
  id: View
  label: string
  icon: React.ReactNode
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'assets', label: 'Assets', icon: <Server size={16} />, badge: 3 },
  { id: 'passwords', label: 'Passwords', icon: <KeyRound size={16} /> },
  { id: 'docs', label: 'Documentation', icon: <FileText size={16} /> },
  { id: 'networks', label: 'Networks', icon: <Network size={16} /> },
  { id: 'licenses', label: 'Licenses', icon: <CreditCard size={16} />, badge: 2 },
]

interface Props {
  currentView: View
  navigate: (v: View) => void
  children: React.ReactNode
}

export default function Layout({ currentView, navigate, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const sidebarW = collapsed ? 60 : 220

  return (
    <div className="flex h-screen bg-navy-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 border-r border-edge-subtle bg-navy-900 transition-all duration-200 overflow-hidden"
        style={{ width: sidebarW }}
      >
        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-edge-subtle flex-shrink-0 ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 16px rgba(37,99,235,0.4)' }}>
            <Shield size={14} className="text-white" />
          </div>
          {!collapsed && (
            <span className="ml-2.5 font-semibold text-ink-primary text-sm tracking-tight whitespace-nowrap">ITDocs</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map(item => {
            const active = currentView === item.id || (currentView === 'asset-detail' && item.id === 'assets') || (currentView === 'doc-editor' && item.id === 'docs')
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-md text-sm transition-all duration-100 text-left group
                  ${active
                    ? 'bg-blue-500/10 text-blue-300'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-navy-700'
                  }`}
                style={{ width: collapsed ? 36 : 'calc(100% - 12px)' }}
              >
                <span className={`flex-shrink-0 ${active ? 'text-blue-400' : 'text-ink-muted group-hover:text-ink-secondary'}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full leading-none">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            )
          })}

          <div className="my-2 mx-3 border-t border-edge-subtle" />

          <button
            onClick={() => navigate('settings')}
            title={collapsed ? 'Settings' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-md text-sm transition-all text-left text-ink-secondary hover:text-ink-primary hover:bg-navy-700
              ${currentView === 'settings' ? 'bg-blue-500/10 text-blue-300' : ''}`}
            style={{ width: collapsed ? 36 : 'calc(100% - 12px)' }}
          >
            <Settings size={16} className="flex-shrink-0 text-ink-muted" />
            {!collapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* User */}
        {!collapsed && (
          <div className="border-t border-edge-subtle px-3 py-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">JD</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink-primary truncate">John Doe</p>
                <p className="text-[10px] text-ink-muted truncate">admin@corp.local</p>
              </div>
              <button className="text-ink-muted hover:text-red-400 transition-colors" title="Sign out">
                <LogOut size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div className={`border-t border-edge-subtle flex-shrink-0 ${collapsed ? 'flex justify-center py-2' : ''}`}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`flex items-center gap-1.5 text-ink-muted hover:text-ink-primary transition-colors text-xs py-2 px-3 w-full hover:bg-navy-700 ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : (
              <>
                <ChevronLeft size={14} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-edge-subtle bg-navy-900 flex items-center px-4 gap-3 flex-shrink-0">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 flex-1 max-w-xs px-3 py-1.5 rounded-lg bg-navy-700 border border-edge-default hover:border-edge-strong text-ink-muted text-sm transition-colors"
          >
            <Search size={13} />
            <span className="text-xs">Search assets, docs, passwords…</span>
            <span className="ml-auto text-[10px] font-mono bg-navy-600 text-ink-muted px-1.5 py-0.5 rounded border border-edge-default">⌘K</span>
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false) }}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-navy-700 transition-colors"
            >
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-72 bg-navy-750 border border-edge-default rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-edge-subtle">
                  <span className="text-xs font-semibold text-ink-primary">Notifications</span>
                  <button onClick={() => setNotifOpen(false)} className="text-ink-muted hover:text-ink-primary"><X size={13} /></button>
                </div>
                {[
                  { title: '2 licenses expiring soon', time: '2h ago', dot: 'bg-orange-500' },
                  { title: 'Asset "SRV-PROD-01" updated', time: '5h ago', dot: 'bg-blue-400' },
                  { title: 'New doc added: Network Topology', time: '1d ago', dot: 'bg-green-500' },
                ].map((n, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-navy-700 cursor-pointer border-b border-edge-subtle last:border-0 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.dot}`} />
                      <div>
                        <p className="text-xs text-ink-primary">{n.title}</p>
                        <p className="text-[10px] text-ink-muted mt-0.5 font-mono">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => { setUserOpen(!userOpen); setNotifOpen(false) }}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-navy-700 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-semibold text-white">JD</div>
              {!collapsed && <ChevronDown size={12} className="text-ink-muted" />}
            </button>
            {userOpen && (
              <div className="absolute right-0 top-10 w-52 bg-navy-750 border border-edge-default rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-edge-subtle">
                  <p className="text-xs font-medium text-ink-primary">John Doe</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">admin@corp.local</p>
                </div>
                {['Profile', 'API Keys', 'Appearance', 'Sign out'].map((item, i) => (
                  <button key={i} className="w-full px-4 py-2.5 text-left text-xs text-ink-secondary hover:text-ink-primary hover:bg-navy-700 transition-colors flex items-center gap-2">
                    {item === 'Sign out' ? <LogOut size={12} className="text-red-400" /> : <User size={12} />}
                    <span className={item === 'Sign out' ? 'text-red-400' : ''}>{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-navy-950">
          {children}
        </main>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-xl mx-4 bg-navy-800 border border-edge-strong rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-edge-subtle">
              <Search size={16} className="text-ink-muted flex-shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-ink-primary text-sm placeholder:text-ink-muted outline-none"
                placeholder="Search assets, documents, passwords…"
              />
              <kbd className="text-[10px] font-mono bg-navy-700 text-ink-muted px-1.5 py-0.5 rounded border border-edge-default">ESC</kbd>
            </div>
            <div className="p-2">
              {[
                { type: 'Asset', label: 'SRV-PROD-01', sub: 'Server · Production' },
                { type: 'Doc', label: 'Network Topology 2024', sub: 'Documentation · Networks' },
                { type: 'Password', label: 'AWS Root Account', sub: 'Passwords · Cloud' },
              ].map((r, i) => (
                <button key={i} onClick={() => setSearchOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-700 transition-colors text-left">
                  <span className="text-[10px] font-mono bg-navy-600 text-ink-muted px-1.5 py-0.5 rounded">{r.type}</span>
                  <div>
                    <p className="text-xs text-ink-primary">{r.label}</p>
                    <p className="text-[10px] text-ink-muted">{r.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Click-outside for dropdowns */}
      {(notifOpen || userOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setNotifOpen(false); setUserOpen(false) }} />
      )}
    </div>
  )
}
