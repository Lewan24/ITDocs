import { useState, useEffect, useRef } from 'react'
import { Server, KeyRound, FileText, CreditCard, ArrowRight, Clock, Star, AlertTriangle, CheckCircle2, Activity, Plus, TrendingUp, Loader2 } from 'lucide-react'
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

export default function Dashboard({ navigate }: Props) {
  const { assets, passwords, licenses, knowledgeArticles, currentOrg, isLoading } = useApp()

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-ink-muted" />
      </div>
    )
  }

  const onlineAssets = assets.filter(a => a.status === 'online').length
  const expiringLicenses = licenses.filter(l => l.status === 'expiring' || l.status === 'expired').length
  const favoriteAssets = assets.filter(a => a.starred).slice(0, 5)
  const recentDocs = [...knowledgeArticles]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)
  const upcomingLicenses = [...licenses]
    .filter(l => l.status === 'expiring')
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 4)

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  const daysUntil = (dateStr: string) => Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000))

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Dashboard</h1>
          <p className="text-xs text-ink-muted mt-0.5 font-mono">{today}{currentOrg ? ` · ${currentOrg.name}` : ''}</p>
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
          <StatCard icon={<Server size={16} />} label="Total Assets" value={assets.length} sub={`${onlineAssets} online`} color="text-blue-400" />
        </div>
        <div onClick={() => navigate('passwords')} className="cursor-pointer">
          <StatCard icon={<KeyRound size={16} />} label="Password Entries" value={passwords.length} sub="All secured" color="text-purple-500" />
        </div>
        <div onClick={() => navigate('knowledge')} className="cursor-pointer">
          <StatCard icon={<FileText size={16} />} label="Documents" value={knowledgeArticles.length} color="text-green-400" />
        </div>
        <div onClick={() => navigate('licenses')} className="cursor-pointer">
          <StatCard icon={<CreditCard size={16} />} label="Expiring Licenses" value={expiringLicenses} sub="Next 60 days" color="text-orange-400" />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick actions + reminders take the activity feed's old spot,
            since there's no activity-log endpoint yet to back a real feed */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-edge-subtle">
              <span className="text-xs font-semibold text-ink-primary">Quick Actions</span>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Add Asset', icon: <Server size={14} />, action: () => navigate('assets'), color: 'text-blue-400' },
                { label: 'New Doc', icon: <FileText size={14} />, action: () => navigate('knowledge'), color: 'text-green-400' },
                { label: 'Add Password', icon: <KeyRound size={14} />, action: () => navigate('passwords'), color: 'text-purple-500' },
                { label: 'Add License', icon: <CreditCard size={14} />, action: () => navigate('licenses'), color: 'text-orange-400' },
              ].map((a, i) => (
                <button key={i} onClick={a.action}
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 border border-edge-subtle hover:border-edge-default transition-all text-xs text-ink-secondary hover:text-ink-primary active:scale-95">
                  <span className={a.color}><Plus size={12} /></span>
                  <span className={`${a.color} flex-shrink-0`}>{a.icon}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reminders — driven by real license expiry now */}
          <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-edge-subtle flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary">
                <Clock size={13} className="text-orange-400" /> Upcoming Renewals
              </div>
              <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded-full">
                {upcomingLicenses.length} pending
              </span>
            </div>
            {upcomingLicenses.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 size={18} className="text-green-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-ink-muted">Nothing expiring soon</p>
              </div>
            ) : (
              <div className="divide-y divide-edge-subtle">
                {upcomingLicenses.map(l => {
                  const days = daysUntil(l.expiryDate)
                  return (
                    <button key={l.id} onClick={() => navigate('licenses')} className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-navy-700/50 transition-colors text-left">
                      <AlertTriangle size={12} className={days <= 14 ? 'text-red-400 flex-shrink-0' : 'text-orange-400 flex-shrink-0'} />
                      <p className="flex-1 text-[11px] text-ink-secondary truncate">{l.name} · {l.vendor}</p>
                      <span className={`text-[10px] font-mono flex-shrink-0 ${days <= 14 ? 'text-red-400' : 'text-orange-400'}`}>{days}d</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent docs */}
        <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-edge-subtle">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-primary"><FileText size={13} className="text-green-400" /> Recent Documents</div>
            <button onClick={() => navigate('knowledge')} className="text-[10px] text-ink-link hover:text-blue-300 transition-colors flex items-center gap-1">View all <ArrowRight size={10} /></button>
          </div>
          {recentDocs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <FileText size={20} className="text-ink-muted mx-auto mb-2 opacity-40" />
              <p className="text-xs text-ink-muted">No documents yet</p>
              <button onClick={() => navigate('knowledge')} className="text-[10px] text-blue-400 hover:text-blue-300 mt-2 transition-colors">Write the first one →</button>
            </div>
          ) : (
            <div className="divide-y divide-edge-subtle">
              {recentDocs.map(doc => (
                <button key={doc.id} onClick={() => navigate('knowledge')} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-navy-700/50 transition-colors text-left group">
                  <FileText size={14} className="text-green-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-ink-primary truncate group-hover:text-blue-300 transition-colors">{doc.title}</p>
                    <p className="text-[10px] text-ink-muted mt-0.5">{doc.category}</p>
                  </div>
                  <span className="text-[10px] font-mono text-ink-muted flex-shrink-0">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Favorite assets */}
        <div className="bg-navy-800 border border-edge-subtle rounded-xl overflow-hidden lg:col-span-1">
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
              {favoriteAssets.map(asset => (
                <button key={asset.id} onClick={() => navigate('asset-detail', asset.id)}
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