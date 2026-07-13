import { useState } from 'react'
import { Bold, Italic, Code, Link2, Image, List, ListOrdered, Quote, Minus, Save, Tag, Paperclip, Eye, Edit2, ChevronDown } from 'lucide-react'

const INITIAL_CONTENT = `# VPN Setup Guide

## Overview

This document describes the procedure for configuring and connecting to the corporate VPN using FortiClient.

## Prerequisites

- Windows 10/11 or macOS 12+
- FortiClient VPN installed (v7.2+)
- Active Directory account with VPN group membership
- MFA configured on your account

## Configuration

### Server Settings

\`\`\`
VPN Gateway:  vpn.corp.local
Port:         443 (SSL)
Protocol:     TLS 1.3
Auth:         LDAP + TOTP
\`\`\`

### Client Setup

1. Open FortiClient and navigate to **Remote Access**
2. Click **Add new connection** and select **SSL-VPN**
3. Enter the gateway address above
4. Enable **Save password** if this is a managed device
5. Click **Save**

## Connecting

Use your **AD credentials** and approve the MFA push notification.

> **Note:** VPN access is logged. Use only for authorized activities.

## Troubleshooting

If the connection fails, verify that your account is in the \`VPN-Users\` group in Active Directory.`

export default function DocEditor() {
  const [title, setTitle] = useState('VPN Setup Guide')
  const [content, setContent] = useState(INITIAL_CONTENT)
  const [category, setCategory] = useState('Access')
  const [tags, setTags] = useState(['vpn', 'forticlient', 'access', 'remote-work'])
  const [newTag, setNewTag] = useState('')
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [saved, setSaved] = useState(false)

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
    }
    setNewTag('')
  }

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const TOOLBAR = [
    { icon: <Bold size={13} />, title: 'Bold', action: () => insertMd('**', '**') },
    { icon: <Italic size={13} />, title: 'Italic', action: () => insertMd('_', '_') },
    { icon: <Code size={13} />, title: 'Inline code', action: () => insertMd('`', '`') },
    null,
    { icon: <List size={13} />, title: 'Bullet list', action: () => insertMd('\n- ', '') },
    { icon: <ListOrdered size={13} />, title: 'Numbered list', action: () => insertMd('\n1. ', '') },
    { icon: <Quote size={13} />, title: 'Blockquote', action: () => insertMd('\n> ', '') },
    { icon: <Minus size={13} />, title: 'Divider', action: () => insertMd('\n---\n', '') },
    null,
    { icon: <Link2 size={13} />, title: 'Link', action: () => insertMd('[', '](url)') },
    { icon: <Image size={13} />, title: 'Image', action: () => insertMd('![alt](', ')') },
  ]

  function insertMd(before: string, after: string) {
    setContent(c => c + before + after)
  }

  const renderPreview = (md: string) => {
    return md
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-ink-primary mt-5 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-ink-primary mt-6 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-ink-primary mt-0 mb-3">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-ink-primary font-semibold">$1</strong>')
      .replace(/_(.+?)_/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-navy-700 text-cyan-400 font-mono text-[11px] border border-edge-subtle">$1</code>')
      .replace(/^```[\w]*\n([\s\S]*?)```/gm, '<pre class="bg-navy-700 border border-edge-subtle rounded-lg p-4 my-3 overflow-x-auto"><code class="text-green-400 font-mono text-xs leading-relaxed">$1</code></pre>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-blue-500 pl-4 text-ink-secondary italic my-2">$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-ink-secondary text-sm leading-relaxed">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-ink-secondary text-sm leading-relaxed">$1</li>')
      .replace(/^---$/gm, '<hr class="border-edge-subtle my-4" />')
      .replace(/\n\n/g, '<p class="mt-3" />')
  }

  return (
    <div className="flex h-full">
      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-edge-subtle bg-navy-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-edge-default overflow-hidden">
              <button
                onClick={() => setMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${mode === 'edit' ? 'bg-navy-700 text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'}`}
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border-l border-edge-default ${mode === 'preview' ? 'bg-navy-700 text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'}`}
              >
                <Eye size={12} /> Preview
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20 animate-pulse">
                Saved
              </span>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium transition-all"
              style={{ boxShadow: '0 1px 10px rgba(37,99,235,0.3)' }}
            >
              <Save size={13} /> Save
            </button>
          </div>
        </div>

        {/* Toolbar */}
        {mode === 'edit' && (
          <div className="flex items-center gap-0.5 px-4 py-2 border-b border-edge-subtle bg-navy-900 flex-shrink-0 flex-wrap">
            {TOOLBAR.map((btn, i) =>
              btn === null ? (
                <div key={i} className="w-px h-4 bg-edge-subtle mx-1" />
              ) : (
                <button
                  key={i}
                  onClick={btn.action}
                  title={btn.title}
                  className="p-1.5 rounded-md text-ink-muted hover:text-ink-primary hover:bg-navy-700 transition-colors"
                >
                  {btn.icon}
                </button>
              )
            )}
          </div>
        )}

        {/* Title */}
        <div className="px-8 pt-6 pb-2 flex-shrink-0">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-2xl font-bold text-ink-primary bg-transparent outline-none placeholder:text-ink-muted border-b border-transparent focus:border-edge-default pb-2 transition-colors"
            placeholder="Document title…"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-4">
          {mode === 'edit' ? (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full h-full min-h-[500px] bg-transparent text-ink-secondary text-sm leading-relaxed outline-none resize-none font-mono placeholder:text-ink-muted"
              placeholder="Start writing in Markdown…"
              spellCheck={false}
            />
          ) : (
            <div
              className="text-ink-secondary text-sm leading-relaxed max-w-none prose-sm"
              dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
            />
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <aside className="w-64 border-l border-edge-subtle bg-navy-900 flex-shrink-0 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* Category */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-navy-800 border border-edge-default text-ink-secondary text-xs focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                {['Access', 'Networks', 'Security', 'Infrastructure', 'Active Directory', 'Cloud', 'Procedures', 'Hardware'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-700 text-[11px] text-ink-secondary font-mono border border-edge-subtle">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-ink-muted hover:text-red-400 transition-colors ml-0.5 leading-none">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Add tag…"
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-navy-800 border border-edge-default text-ink-secondary text-xs placeholder:text-ink-muted focus:border-blue-500 focus:outline-none"
              />
              <button onClick={addTag} className="px-2.5 py-1.5 rounded-lg bg-navy-700 text-ink-secondary text-xs hover:bg-navy-600 transition-colors border border-edge-default">
                <Tag size={11} />
              </button>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Attachments</label>
            <div className="space-y-1.5">
              {[
                { name: 'forticlient_setup.pdf', size: '2.1 MB' },
                { name: 'vpn_topology.png', size: '450 KB' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-800 border border-edge-subtle text-xs">
                  <Paperclip size={11} className="text-ink-muted flex-shrink-0" />
                  <span className="flex-1 text-ink-secondary truncate text-[11px]">{f.name}</span>
                  <span className="text-[10px] font-mono text-ink-muted">{f.size}</span>
                </div>
              ))}
              <button className="w-full px-3 py-2 rounded-lg border border-dashed border-edge-strong text-[11px] text-ink-muted hover:text-ink-secondary hover:border-edge-default transition-colors flex items-center justify-center gap-1.5">
                <Paperclip size={11} /> Attach file
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <label className="block text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">Metadata</label>
            <div className="space-y-2 text-[11px]">
              {[
                { label: 'Author', value: 'John Doe' },
                { label: 'Created', value: '2024-09-10' },
                { label: 'Modified', value: '2026-07-07' },
                { label: 'Version', value: 'v1.4' },
              ].map((m, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-ink-muted">{m.label}</span>
                  <span className="text-ink-secondary font-mono">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
