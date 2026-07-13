import { useState } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'

interface Props { onLogin: () => void }

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('admin@corp.local')
  const [password, setPassword] = useState('••••••••')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); onLogin() }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#e6edf5 1px, transparent 1px), linear-gradient(90deg, #e6edf5 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(37,99,235,0.08) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-[400px] px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4 shadow-lg" style={{ boxShadow: '0 0 32px rgba(37,99,235,0.4)' }}>
            <Shield size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">ITDocs</h1>
          <p className="text-ink-muted text-sm mt-1">Enterprise IT Documentation Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-edge-default bg-navy-800 p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-ink-primary mb-5">Sign in to your workspace</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-navy-700 border border-edge-default text-ink-primary text-sm placeholder:text-ink-muted focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg bg-navy-700 border border-edge-default text-ink-primary text-sm placeholder:text-ink-muted focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-secondary transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setRemember(!remember)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer ${remember ? 'bg-blue-500 border-blue-500' : 'border-edge-strong bg-transparent'}`}
                >
                  {remember && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-ink-secondary">Remember me</span>
              </label>
              <button type="button" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ boxShadow: '0 1px 12px rgba(37,99,235,0.35)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">
          Self-hosted · v1.0.0 · <span className="text-ink-link hover:underline cursor-pointer">Documentation</span>
        </p>
      </div>
    </div>
  )
}
