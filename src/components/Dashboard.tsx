import { useState, useEffect, useRef } from 'react'
import { Server, KeyRound, FileText, CreditCard, ArrowRight, Clock, Star, AlertTriangle, CheckCircle2, Activity, Plus, TrendingUp } from 'lucide-react'
import { useApp } from '../context/useApp'
import type { View } from '../App'

interface Props { navigate: (v: View, id?: string) => void }

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const prevRef = useRef(0)

  useEffect(() => {
    const start = prevRef.current
    const end = value
    if (start === end) return
    const duration = 400
    const startTime = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1)
      const ease = 1 - (1 - t) * (1 - t)
      setDisplay(Math.round(start + (end - start) * ease))
      if (t < 1) requestAnimationFrame(tick)
      else prevRef.current = end
    }
    requestAnimationFrame(tick)
  }, [value])

  return <>{display}</>
}

function StatCard({ icon, label, value, sub, color, trend }: { icon: React.ReactNode; label: string; value: number; sub?: string; color: string; trend?: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-navy-800 border rounded-xl p-5 flex flex-col gap-3 cursor-default transition-all duration-200 ${hovered ? 'border-edge-strong shadow-lg shadow-black/20 -translate-y-0.5' : 'border-edge-subtle'}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('-400', '-500/15').replace('-300', '-500/15')}`}>
          <span className={color}>{icon}</span>
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[10px] text-green-400 font-mono bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20">
            <TrendingUp size={9} /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-ink-primary font-mono"><AnimatedNumber value={value} /></p>
        <p className="text-xs font-medium text-ink-secondary mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-ink-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function PulsingDot({ status }: { status: string }) {
  const colors: Record<string, string> = { online: 'bg-green-400', offline: 'bg-red-400', maintenance: 'bg-orange-400', unknown: 'bg-navy-400' }
  return (
    <span className="relative inline-flex">
      <span className={`w-1.5 h-1.5 rounded-full ${colors[status] ?? colors.unknown}`} />
      {status === 'online' && <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" />}
    </span>
  )
}

const RECENT_DOCS = [
  { title: 'Network Topology 2024', category: 'Networks', updated: '2h ago', icon: '🗺️' },
  { title: 'VPN Setup Guide', category: 'Access', updated: '4h ago', icon: '🔐' },
  { title: 'Firewall Rules — DMZ', category: 'Security', updated: '1d ago', icon: '🛡️' },
  { title: 'AD Domain Structure', category: 'Active Directory', updated: '2d ago', icon: '🏢' },
]

const REMINDERS = [
  { text: 'SSL cert *.corp.local expires', days: 7, level: 'danger' as const },
  { text: 'Quarterly password audit', days: 14, level: 'warn' as const },
  { text: 'Windows Server 2022 license renewal', days: 21, level: 'warn' as const },
  { text: 'VMware vSphere license', days: 45, level: 'ok' as const },
]

export default function Dashboard({ navigate }: Props) {
  const { assets, passwords } = useApp()

  const onlineAssets = assets.filter(a => a.status === 'online').length
  const expiringLicenses = 2
  const favoriteAssets = assets.filter(a => a.starred).slice(0, 5)

  const recentActivity = [
    { icon: <Server size={13} />, color: 'text-blue-400', text: `${assets[0]?.name ?? 'SRV-PROD-01'} status updated`, time: '2h ago', who: 'John Doe' },
    { icon: <FileText size={13} />, color: 'text-green-400', text: 'Doc "VPN Setup Guide" created', time: '4h ago', who: 'Sarah K.' },
    { icon: <KeyRound size={13} />, color: 'text-purple-500', text: 'Password "AWS Root" rotated', time: '6h ago', who: 'John Doe' },
    { icon: <CreditCard size={13} />, color: 'text-orange-400', text: 'License "Windows Server" renewed', time: '1d ago', who: 'Mike T.' },
    { icon: <Server size={13} />, color: 'text-blue-400', text: `${assets[5]?.name ?? 'FW-EDGE-01'} added`, time: '2d ago', who: 'Sarah K.' },
    { icon: <FileText size={13} />, color: 'text-green-400', text: 'Doc "Firewall Rules" updated', time: '3d ago', who: 'John Doe' },
  ]

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Dashboard</h1>
          <p className="text-xs text-ink-muted mt-0.5 font-mono">Monday, 07 July 2026 · CORP-DC01</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
            <PulsingDot status="online" /> {onlineAssets} assets online
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div onClick={() => navigate('assets')} className="cursor-pointer">
          <StatCard icon={<Server size={16} />} label="Total Assets" value={assets.length} sub={`${onlineAssets} online`} color="text-blue-400" trend="+3 this week" />
        </div>
        <div onClick={() => navigate('passwords')} className="cursor-pointer">
          <StatCard icon={<KeyRound size={16} />} label="Password Entries" value={passwords.length} sub="All secured" color="text-purple-500" />
        </div>
        <div onClick={() => navigate('knowledge')} className="cursor-pointer">
          <StatCard icon={<FileText size={16} />} label="Documents" value={64} sub="4 updated today" color="text-green-400" trend="+2" />
        </div>
        <div onClick={() => navigate('licenses')} className="cursor-pointer">
          <StatCard icon={<CreditCard size={16} />} label="Expiring Licenses" value={expiringLicenses} sub="Next 30 days" color="text-orange-400" />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-subtle">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
              <Activity size={13} className="text-blue-400" /> Recent Activity
            </div>
            <button className="text-[10px] text-ink-link hover:text-blue-300 transition-colors flex items-center gap-1">View all <ArrowRight size={10} /></button>
          </div>
          <div className="divide-y divide-edge-subtle">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-navy-700/50 transition-colors group cursor-default">
                <div className={`w-6 h-6 rounded-md bg-navy-700 flex items-center justify-center flex-shrink-0 ${item.color}`}>{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-primary truncate">{item.text}</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">{item.who}</p>
                </div>
                <span className="text-[10px] font-mono text-ink-muted flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick actions */}
          <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-edge-subtle">
              <span className="text-xs font-semibold text-ink-primary">Quick Actions</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {[
                { label: 'Add Asset', icon: <Server size={14} />, action: () => navigate('assets'), color: 'text-blue-400', bg: 'group-hover:bg-blue-500/10' },
                { label: 'New Doc', icon: <FileText size={14} />, action: () => navigate('knowledge'), color: 'text-green-400', bg: 'group-hover:bg-green-500/10' },
                { label: 'Add Password', icon: <KeyRound size={14} />, action: () => navigate('passwords'), color: 'text-purple-500', bg: 'group-hover:bg-purple-500/10' },
                { label: 'Add License', icon: <CreditCard size={14} />, action: () => navigate('licenses'), color: 'text-orange-400', bg: 'group-hover:bg-orange-500/10' },
              ].map((a, i) => (
                <button key={i} onClick={a.action}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 border border-edge-subtle hover:border-edge-default transition-all text-xs text-ink-secondary hover:text-ink-primary active:scale-95`}>
                  <span className={a.color}><Plus size={12} /></span>
                  <span className={`${a.color} flex-shrink-0`}>{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-edge-subtle flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
                <Clock size={13} className="text-orange-400" /> Upcoming Reminders
              </div>
              <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
                {REMINDERS.filter(r => r.level !== 'ok').length} pending
              </span>
            </div>
            <div className="divide-y divide-edge-subtle">
              {REMINDERS.map((r, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5 hover:bg-navy-700/50 transition-colors cursor-default">
                  {r.level === 'danger' ? <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />
                    : r.level === 'warn' ? <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />
                    : <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />}
                  <p className="flex-1 text-[11px] text-ink-secondary truncate">{r.text}</p>
                  <span className={`text-[10px] font-mono flex-shrink-0 ${r.level === 'danger' ? 'text-red-400' : r.level === 'warn' ? 'text-orange-400' : 'text-green-400'}`}>{r.days}d</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent docs */}
        <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-subtle">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary"><FileText size={13} className="text-green-400" /> Recent Documents</div>
            <button onClick={() => navigate('knowledge')} className="text-[10px] text-ink-link hover:text-blue-300 transition-colors flex items-center gap-1">View all <ArrowRight size={10} /></button>
          </div>
          <div className="divide-y divide-edge-subtle">
            {RECENT_DOCS.map((doc, i) => (
              <button key={i} onClick={() => navigate('knowledge')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-navy-700/50 transition-colors text-left group">
                <span className="text-base flex-shrink-0">{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink-primary truncate group-hover:text-blue-300 transition-colors">{doc.title}</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">{doc.category}</p>
                </div>
                <span className="text-[10px] font-mono text-ink-muted flex-shrink-0">{doc.updated}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Favorite assets */}
        <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-subtle">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary"><Star size={13} className="text-yellow-400 fill-yellow-400" /> Favorite Assets</div>
            <button onClick={() => navigate('assets')} className="text-[10px] text-ink-link hover:text-blue-300 transition-colors flex items-center gap-1">All <ArrowRight size={10} /></button>
          </div>
          {favoriteAssets.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Star size={20} className="text-ink-muted mx-auto mb-2 opacity-40" />
              <p className="text-xs text-ink-muted">Star assets to see them here</p>
              <button onClick={() => navigate('assets')} className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 transition-colors">Browse assets →</button>
            </div>
          ) : (
            <div className="divide-y divide-edge-subtle">
              {favoriteAssets.map((asset, i) => (
                <button key={i} onClick={() => navigate('asset-detail', asset.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-navy-700/50 transition-colors text-left group">
                  <PulsingDot status={asset.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-ink-primary group-hover:text-blue-300 transition-colors">{asset.name}</p>
                    <p className="text-[10px] text-ink-muted">{asset.type}</p>
                  </div>
                  <span className={`text-[10px] font-mono capitalize flex-shrink-0 ${asset.status === 'online' ? 'text-green-400' : asset.status === 'maintenance' ? 'text-orange-400' : 'text-red-400'}`}>
                    {asset.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
