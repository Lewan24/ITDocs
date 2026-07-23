import { useEffect, useRef, useState } from 'react'
import {
  FileText,
  CreditCard,
  ArrowRight,
  Clock,
  Star,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Users,
  FileSignature,
  CircleAlert,
  Target,
  Phone,
  Server,
  KeyRound,
  Plus,
} from 'lucide-react'

import { useApp } from '../context/useApp'
import type { View } from '../App'
import { Priority } from '../api/types'


interface Props {
  navigate: (v: View, id?: string) => void
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const previous = useRef(0)

  useEffect(() => {
    const start = previous.current
    const end = value

    if (start === end)
      return

    const duration = 400
    const startTime = performance.now()

    const animate = (time: number) => {
      const progress =
        Math.min((time - startTime) / duration, 1)

      const ease =
        1 - Math.pow(1 - progress, 2)

      setDisplay(
        Math.round(start + (end - start) * ease)
      )

      if (progress < 1)
        requestAnimationFrame(animate)
      else
        previous.current = end
    }

    requestAnimationFrame(animate)
  }, [value])

  return <>{display}</>
}

function Panel({title, icon, children, action}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  action?: React.ReactNode
}) {

  return (
    <div className="
      bg-navy-800
      border border-edge-subtle
      rounded-xl
      overflow-hidden
    ">

      <div className="
        px-5 py-3.5
        border-b border-edge-subtle
        flex items-center justify-between
      ">

        <div className="
          flex items-center gap-2
          text-xs font-semibold
          text-ink-primary
        ">
          {icon}
          {title}
        </div>

        {action}

      </div>


      {children}

    </div>
  )
}



function StatusDot({
  color
}: {
  color: string
}) {

  return (
    <span
      className={`
        w-2 h-2 rounded-full
        ${color}
      `}
    />
  )
}



function PriorityBadge({priority}: {
  priority: Priority
}) {

  const styles = {
    high:
      'text-red-400 bg-red-500/10 border-red-500/20',

    medium:
      'text-orange-400 bg-orange-500/10 border-orange-500/20',

    low:
      'text-green-400 bg-green-500/10 border-green-500/20',
  }

  return (
    <span className={`
      text-[10px]
      px-1.5 py-0.5
      rounded-full
      border
      uppercase
      font-mono
      ${styles[priority]}
    `}>
      {priority}
    </span>
  )
}

export default function Dashboard({ navigate }: Props) {
  const {
    assets,
    licenses,
    knowledgeArticles,
    passwords,
    currentOrg,
    tasks,
    contracts,
    contacts,
    plans,
    incidents,
    isLoading
  } = useApp()

  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 60 * 60 * 1000)

    return () => clearInterval(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="
        h-64
        flex items-center justify-center
      ">
        <Loader2
          size={22}
          className="
            animate-spin
            text-ink-muted
          "
        />
      </div>
    )
  }

  const openIncidents =
    incidents.filter(
      x => x.status === 'open' || x.status === 'investigating'
    ).length

  const openTasks =
    tasks.filter(
      x => x.status === 'in-progress'
    )

  const expiringLicenses =
    licenses.filter(
      x =>
        x.status === 'expiring'
        ||
        x.status === 'expired'
    )

  const expiringContracts =
    contracts.filter(
      x =>
        daysUntil(x.endDate) <= 60
    )

  const favoriteAssets =
    assets
      .filter(x => x.starred)
      .slice(0, 5)

  const recentDocs =
    [...knowledgeArticles]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime()
          -
          new Date(a.updatedAt).getTime()
      )
      .slice(0, 4)

  function daysUntil(date: string) {
    return Math.max(
      0,
      Math.ceil(
        (
          new Date(date).getTime()
          -
          now
        )
        /
        86400000
      )
    )
  }

  function PlanProgress(targetDate:string, createdAt:string){
    const start = new Date(createdAt).getTime()
    const end = new Date(targetDate).getTime()
    const now = Date.now()

    const total = end - start
    const elapsed = now - start
    const progress = (elapsed / total) * 100

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(progress)
      )
    )
  }

  const today =
    new Date()
      .toLocaleDateString(
        undefined,
        {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }
      )

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">
            Dashboard
          </h1>
          <p className="text-xs text-ink-muted font-mono mt-1">
            {today}
            {
              currentOrg &&
              ` · ${currentOrg.name}`
            }
          </p>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="lg:col-span-3 flex flex-col gap-4">
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
                    className="cursor-pointer group flex items-center gap-2 px-3 py-2.5 rounded-lg bg-navy-700 hover:bg-navy-600 border border-edge-subtle hover:border-edge-default transition-all text-xs text-ink-secondary hover:text-ink-primary active:scale-95">
                    <span className={a.color}><Plus size={12} /></span>
                    <span className={`${a.color} flex-shrink-0`}>{a.icon}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-xs uppercase tracking-wide text-ink-muted mb-3">
          Attention
        </h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <div onClick={() => navigate('tasks')} className="cursor-pointer hover:scale-105 transision transision-all duration-300 hover:shadow-xl hover:shadow-red-400/20">
            <AttentionCard
              icon={<CheckSquare size={16} />}
              title="Open Tasks"
              value={openTasks.length}
              sub="Need attention"
              color="text-red-400"
            />
          </div>
          <div onClick={() => navigate('licenses')} className="cursor-pointer hover:scale-105 transision transision-all duration-300 hover:shadow-xl hover:shadow-orange-400/20">
            <AttentionCard
              icon={<CreditCard size={16} />}
              title="Licenses"
              value={expiringLicenses.length}
              sub="Expiring soon"
              color="text-orange-400"
            />
          </div>
          <div onClick={() => navigate('contracts')} className="cursor-pointer hover:scale-105 transision transision-all duration-300 hover:shadow-xl hover:shadow-yellow-400/20">
            <AttentionCard
              icon={<FileSignature size={16} />}
              title="Contracts"
              value={expiringContracts.length}
              sub="Renewals"
              color="text-yellow-400"
            />
          </div>
          <div onClick={() => navigate('incidents')} className="cursor-pointer hover:scale-105 transision transision-all duration-300 hover:shadow-xl hover:shadow-red-400/20">
            <AttentionCard
              icon={<CircleAlert size={16} />}
              title="Open Incidents"
              value={openIncidents}
              sub="Check status"
              color="text-red-400"
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <Panel title="My Tasks"
            icon={
              <CheckSquare
                size={14}
                className="text-red-400"
              />
            }
            action={
              <button
                onClick={() => navigate('tasks')}
                className="text-[10px] text-blue-400 flex items-center gap-1 cursor-pointer">
                View all
                <ArrowRight size={10} />
              </button>
            }>
            <div className="divide-y divide-edge-subtle">
              {
                openTasks.map(task => (
                  <div key={task.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-navy-700/40">
                    <CircleAlert size={14} className="text-red-400"/>
                    <div className="flex-1">
                      <p className="text-xs text-ink-primary">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        Due {task.dueDate}
                      </p>
                    </div>
                    <PriorityBadge
                      priority={task.priority}
                    />
                  </div>
                ))
              }
            </div>
          </Panel>
          <Panel
            title="Upcoming Renewals"
            icon={
              <Clock
                size={14}
                className="text-orange-400"
              />
            }>
            <div className="divide-y divide-edge-subtle">
              {
                [...expiringLicenses]
                  .slice(0, 4)
                  .map(item => (
                    <div
                      key={item.id}
                      className="px-5 py-3 flex gap-3 items-center">
                      <AlertTriangle
                        size={13}
                        className="text-orange-400"
                      />
                      <span className="flex-1 text-xs text-ink-secondary">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-orange-400">
                        {
                          daysUntil(
                            item.expiryDate
                          )
                        }d
                      </span>
                    </div>
                  ))
              }
            </div>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel
            title="Favorite Assets"
            icon={
              <Star
                size={14}
                className="text-yellow-400 fill-yellow-400"
              />
            }
            action={
              <button onClick={() => navigate('assets')}
                className="text-[10px] text-blue-400 flex items-center gap-1 cursor-pointer">
                All
                <ArrowRight size={10} />
              </button>
            }>
            <div className="divide-y divide-edge-subtle">
              {
                favoriteAssets.length === 0 && (
                  <p className="px-5 py-6 text-center text-xs text-ink-muted">
                    No favorite assets
                  </p>
                )
              }
              {
                favoriteAssets.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() =>
                      navigate(
                        'asset-detail',
                        asset.id
                      )
                    }
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-navy-700/40 text-left cursor-pointer">
                    <StatusDot
                      color={
                        asset.status === 'online'
                          ?
                          'bg-green-400'
                          :
                          'bg-red-400'
                      }
                    />
                    <div className="flex-1">
                      <p className="text-xs text-ink-primary">
                        {asset.name}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {asset.type}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-ink-muted">
                      {asset.status}
                    </span>
                  </button>
                ))
              }
            </div>
          </Panel>
          <Panel
            title="Recent Documents"
            icon={
              <FileText
                size={14}
                className="text-green-400"
              />
            }
            action={
              <button
                onClick={() => navigate('knowledge')}
                className="text-[10px] text-blue-400 flex gap-1 items-center cursor-pointer">
                All
                <ArrowRight size={10} />
              </button>
            }>
            <div className="divide-y divide-edge-subtle">
              {
                recentDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() =>
                      navigate('knowledge')
                    }
                    className="w-full px-5 py-3 text-left hover:bg-navy-700/40 cursor-pointer">
                    <p className="text-xs text-ink-primary">
                      {doc.title}
                    </p>
                    <p className="text-[10px] text-ink-muted mt-1">
                      {doc.category}
                    </p>
                  </button>
                ))
              }
            </div>
          </Panel>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div onClick={() => navigate('plans')} className="grid cursor-pointer hover:scale-102 transision transision-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20">
          <Panel
            title="Roadmap"
            icon={
              <Target
                size={14}
                className="text-cyan-400"
              />
            }>
            <div className="divide-y divide-edge-subtle">
              {
                plans.map(plan => (
                  <div
                    key={plan.id}
                    className="px-5 py-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-ink-primary">
                        {plan.title}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {plan.targetDate}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-navy-700 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400"
                        style={{
                          width:`${PlanProgress(
                              plan.targetDate,
                              plan.createdAt
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ))
              }
            </div>
          </Panel>
        </div>
        <div onClick={() => navigate('contracts')} className="grid cursor-pointer hover:scale-102 transision transision-all duration-300 hover:shadow-xl hover:shadow-green-500/20">
          <Panel
            title="Contracts"
            icon={
              <FileSignature
                size={14}
                className="text-emerald-400"
              />
            }>
            <div className="divide-y divide-edge-subtle">
              {
                contracts.map(contract => (

                  <div key={contract.id} className="px-5 py-3">
                    <p className="text-xs text-ink-primary">
                      {contract.name}
                    </p>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-ink-muted">
                        {contract.vendor}
                      </span>
                      <span className="text-[10px] text-orange-400 font-mono">
                        {daysUntil(contract.endDate)}d
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </Panel>
        </div>

        <div onClick={() => navigate('contracts')} className="grid cursor-pointer hover:scale-102 transision transision-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
          <Panel
            title="Important Contacts"
            icon={
              <Users
                size={14}
                className="text-indigo-400"
              />
            }>
            <div className="divide-y divide-edge-subtle">
              {
                contacts.map(contact => (
                  <div key={contact.id} className="px-5 py-3 flex gap-3 items-center">
                    <div className="w-7 h-7 rounded-full bg-navy-700 flex items-center justify-center">
                      <Phone
                        size={12}
                        className="text-indigo-400"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-ink-primary">
                        {contact.name}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        {contact.company}
                        {' · '}
                        {contact.role}
                      </p>
                    </div>
                  </div>
                ))
              }
            </div>
          </Panel>
        </div>
      </div>

      <h2 className="text-xs uppercase tracking-wide text-ink-muted mb-3">
          Statistics
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {
          [
            ['Assets', assets.length, 'assets'],
            ['Passwords', passwords.length, 'passwords'],
            ['Documents', knowledgeArticles.length, 'knowledge'],
            ['Licenses', licenses.length, 'licenses'],
            ['Tasks', openTasks.length, 'tasks'],
            ['Plans', plans.length, 'plans'],
            ['Contracts', contracts.length, 'contracts'],
            ['Contacts', contacts.length, 'contacts'],
          ]
            .map(([label, value, view]) => (
              <div key={label} onClick={() => navigate(view as View)}
                className="bg-navy-800 border border-edge-subtle rounded-xl p-3 text-center cursor-pointer
                hover:scale-102 transision transision-all duration-300 hover:shadow-xl hover:shadow-gray-500/20
                hover:outline-2 outline-blue-400">
                <p className="text-xl font-mono text-ink-primary">
                  <AnimatedNumber value={Number(value)} />
                </p>
                <p className="text-[14px] text-ink-muted">
                  {label}
                </p>
              </div>
            ))
        }
      </div>
    </div>
  )
}

function AttentionCard({icon, title, value, sub, color}: {
  icon: React.ReactNode
  title: string
  value: number
  sub: string
  color: string
}) {
  return (
    <div className="bg-navy-800 border border-edge-subtle rounded-xl p-5">
      <div className="flex justify-between items-center">
        <div className={`w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-mono font-semibold text-ink-primary">
          <AnimatedNumber value={value} />
        </p>
        <p className="text-xs text-ink-secondary">
          {title}
        </p>
        <p className="text-[10px] text-ink-muted">
          {sub}
        </p>
      </div>
    </div>
  )
}