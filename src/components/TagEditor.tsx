import { useState, type ReactNode } from 'react'
import { inputClass } from './FormField'

export function TagEditor({ tags, onChange, addLabel = 'Add' }: { tags: string[]; onChange: (tags: string[]) => void; addLabel?: ReactNode }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const t = input.trim().toLowerCase()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  const removeTag = (t: string) => onChange(tags.filter(x => x !== t))

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-700 border border-edge-subtle text-[11px] text-ink-secondary font-mono">
              {t}
              <button type="button" onClick={() => removeTag(t)} className="text-ink-muted hover:text-red-400 transition-colors ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          placeholder="Add tag and press Enter"
          className={inputClass() + ' flex-1'}
        />
        <button type="button" onClick={addTag} className="px-3 py-2 rounded-lg bg-navy-700 border border-edge-default text-ink-secondary text-xs hover:bg-navy-600 transition-colors">{addLabel}</button>
      </div>
    </div>
  )
}
