import { useState } from 'react'
import {
  Plus, X, Edit2, Trash2, Calendar,
  User, CheckSquare, ChevronRight, ChevronLeft,
} from 'lucide-react'
import { useApp } from '../context/useApp'
import type { Task, Priority, TaskStatus } from '../context/AuthContext'

const PRIORITIES: Priority[] = ['high', 'medium', 'low']
const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']

const PRIORITY_CONFIG: Record<Priority, { cls: string; dot: string; label: string }> = {
  high:   { cls: 'text-red-400 bg-red-500/10 border-red-500/25',     dot: 'bg-red-400',    label: 'High' },
  medium: { cls: 'text-orange-400 bg-orange-500/10 border-orange-500/25', dot: 'bg-orange-400', label: 'Medium' },
  low:    { cls: 'text-green-400 bg-green-500/10 border-green-500/25',   dot: 'bg-green-400',  label: 'Low' },
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; col: string }> = {
  'todo':       { label: 'To Do',       col: 'border-edge-subtle' },
  'in-progress': { label: 'In Progress', col: 'border-cyan-500/30' },
  'done':        { label: 'Done',        col: 'border-green-500/30' },
}

function isOverdue(dueDate: string) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

const inp = (err?: string) =>
  `w-full px-3 py-2 rounded-lg bg-navy-700 border text-ink-primary text-xs placeholder:text-ink-muted focus:outline-none transition-colors ${err ? 'border-red-500/50 focus:border-red-500' : 'border-edge-default focus:border-blue-500'}`

// ─── Task Modal ───────────────────────────────────────────────────────────────

function TaskModal({ initial, onClose, onSave, onDelete }: {
  initial?: Task
  onClose: () => void
  onSave: (t: Omit<Task, 'id' | 'createdAt'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    priority: initial?.priority ?? 'medium' as Priority,
    status: initial?.status ?? 'todo' as TaskStatus,
    assignee: initial?.assignee ?? '',
    dueDate: initial?.dueDate ?? '',
    tags: initial?.tags.join(', ') ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (k: string, v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required'
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority as Priority,
      status: form.status as TaskStatus,
      assignee: form.assignee.trim(),
      dueDate: form.dueDate,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-navy-800 border border-edge-strong rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ animation: 'modalIn 0.18s ease-out' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-edge-subtle">
          <div>
            <h2 className="text-sm font-semibold text-ink-primary">{initial ? 'Edit Task' : 'Add Task'}</h2>
            <p className="text-[11px] text-ink-muted mt-0.5">IT task or action item</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors"><X size={14} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Replace firewall firmware" className={inp(errors.title)} autoFocus />
            {errors.title && <p className="text-[10px] text-red-400 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Optional details about this task…" className={inp() + ' resize-none'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inp()}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inp()}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Assignee</label>
              <input value={form.assignee} onChange={e => set('assignee', e.target.value)} placeholder="John Doe" className={inp()} />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className={inp()} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="network, security, maintenance" className={inp()} />
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-edge-subtle bg-navy-900/40">
          {initial && onDelete ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-ink-muted">Delete this task?</span>
                <button onClick={onDelete} className="text-[11px] text-red-400 hover:text-red-300 font-medium">Yes</button>
                <button onClick={() => setConfirmDelete(false)} className="text-[11px] text-ink-muted">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-red-400 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            )
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-ink-secondary text-xs border border-edge-default transition-colors">Cancel</button>
            <button onClick={submit} className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium transition-all active:scale-95"
              style={{ boxShadow: '0 1px 10px rgba(37,99,235,0.3)' }}>
              {initial ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onEdit, onMove }: {
  task: Task
  onEdit: () => void
  onMove: (dir: 'prev' | 'next') => void
}) {
  const pc = PRIORITY_CONFIG[task.priority]
  const overdue = isOverdue(task.dueDate)
  const statusIdx = STATUSES.indexOf(task.status)

  return (
    <div className="bg-navy-800 border border-edge-subtle rounded-xl px-3.5 py-3 hover:border-edge-default transition-all group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-xs font-semibold text-ink-primary leading-snug flex-1 min-w-0">{task.title}</p>
        <button onClick={onEdit} className="p-1 rounded text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
          <Edit2 size={11} />
        </button>
      </div>
      {task.description && (
        <p className="text-[11px] text-ink-muted truncate mb-2">{task.description}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${pc.cls}`}>
          <span className={`w-1 h-1 rounded-full ${pc.dot}`} />{pc.label}
        </span>
        {task.assignee && (
          <span className="inline-flex items-center gap-1 text-[10px] text-ink-muted">
            <User size={9} /> {task.assignee}
          </span>
        )}
      </div>
      {(task.dueDate || task.tags.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${overdue && task.status !== 'done' ? 'text-red-400' : 'text-ink-muted'}`}>
              <Calendar size={9} /> {task.dueDate}
              {overdue && task.status !== 'done' && <span className="text-[9px]">· overdue</span>}
            </span>
          )}
          {task.tags.slice(0, 2).map(t => (
            <span key={t} className="text-[9px] text-ink-muted px-1 py-0.5 rounded bg-navy-700 border border-edge-subtle">{t}</span>
          ))}
        </div>
      )}
      {/* Status move buttons */}
      <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-edge-subtle">
        <button
          onClick={() => onMove('prev')}
          disabled={statusIdx === 0}
          className="flex items-center gap-0.5 text-[10px] text-ink-muted hover:text-ink-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-1.5 py-0.5 rounded hover:bg-navy-700">
          <ChevronLeft size={10} /> {statusIdx > 0 ? STATUS_CONFIG[STATUSES[statusIdx - 1]].label : ''}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => onMove('next')}
          disabled={statusIdx === STATUSES.length - 1}
          className="flex items-center gap-0.5 text-[10px] text-ink-muted hover:text-ink-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-1.5 py-0.5 rounded hover:bg-navy-700">
          {statusIdx < STATUSES.length - 1 ? STATUS_CONFIG[STATUSES[statusIdx + 1]].label : ''} <ChevronRight size={10} />
        </button>
      </div>
    </div>
  )
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export default function Tasks() {
  const { tasks, addTask, updateTask, deleteTask } = useApp()
  const [modal, setModal] = useState<{ open: boolean; initial?: Task }>({ open: false })
  const [mobileStatus, setMobileStatus] = useState<TaskStatus>('todo')

  const byStatus = (s: TaskStatus) => tasks.filter(t => t.status === s)

  const handleSave = (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (modal.initial) {
      updateTask({ ...modal.initial, ...data })
    } else {
      addTask(data)
    }
    setModal({ open: false })
  }

  const handleDelete = (id: string) => {
    deleteTask(id)
    setModal({ open: false })
  }

  const moveTask = (task: Task, dir: 'prev' | 'next') => {
    const idx = STATUSES.indexOf(task.status)
    const nextIdx = dir === 'next' ? idx + 1 : idx - 1
    if (nextIdx < 0 || nextIdx >= STATUSES.length) return
    updateTask({ ...task, status: STATUSES[nextIdx] })
  }

  const colHeader = (s: TaskStatus) => {
    const count = byStatus(s).length
    const colCls: Record<TaskStatus, string> = {
      'todo': 'text-ink-secondary',
      'in-progress': 'text-cyan-400',
      'done': 'text-green-400',
    }
    return (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className={`text-xs font-semibold ${colCls[s]}`}>{STATUS_CONFIG[s].label}</p>
          <span className="text-[10px] font-mono text-ink-muted bg-navy-700 border border-edge-subtle px-1.5 py-0.5 rounded-full">{count}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Tasks</h1>
          <p className="text-xs text-ink-muted mt-0.5">{tasks.length} tasks · {byStatus('in-progress').length} in progress</p>
        </div>
        <button onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 active:scale-95 text-white text-sm font-medium transition-all flex-shrink-0"
          style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.3)' }}>
          <Plus size={14} /> Add Task
        </button>
      </div>

      {/* Mobile status tabs */}
      <div className="flex items-center gap-1 mb-4 bg-navy-800 border border-edge-subtle rounded-xl p-1 w-fit lg:hidden">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setMobileStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mobileStatus === s ? 'bg-navy-600 text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'}`}>
            {STATUS_CONFIG[s].label}
            <span className="ml-1.5 text-[10px] text-ink-muted">{byStatus(s).length}</span>
          </button>
        ))}
      </div>

      {/* Kanban columns — desktop */}
      <div className="hidden lg:grid grid-cols-3 gap-4">
        {STATUSES.map(s => (
          <div key={s} className={`bg-navy-800/50 border rounded-xl p-4 ${STATUS_CONFIG[s].col}`}>
            {colHeader(s)}
            {byStatus(s).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <CheckSquare size={20} className="text-ink-muted opacity-30" />
                <p className="text-xs text-ink-muted">No tasks</p>
              </div>
            ) : (
              <div className="space-y-2">
                {byStatus(s).map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => setModal({ open: true, initial: task })}
                    onMove={dir => moveTask(task, dir)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile single column */}
      <div className="lg:hidden">
        <div className={`bg-navy-800/50 border rounded-xl p-4 ${STATUS_CONFIG[mobileStatus].col}`}>
          {colHeader(mobileStatus)}
          {byStatus(mobileStatus).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <CheckSquare size={20} className="text-ink-muted opacity-30" />
              <p className="text-xs text-ink-muted">No tasks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {byStatus(mobileStatus).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => setModal({ open: true, initial: task })}
                  onMove={dir => moveTask(task, dir)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {modal.open && (
        <TaskModal
          initial={modal.initial}
          onClose={() => setModal({ open: false })}
          onSave={handleSave}
          onDelete={modal.initial ? () => handleDelete(modal.initial!.id) : undefined}
        />
      )}
    </div>
  )
}
