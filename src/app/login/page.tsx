'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Connection error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3 animate-bounce" style={{ animationDuration: '2s' }}>
            💸
          </div>
          <h1
            className="text-5xl font-bold tracking-widest mb-2 neon-cyan animate-flicker"
            style={{ fontFamily: "'Share Tech Mono', monospace" }}
          >
            CASHBROS
          </h1>
          <p className="text-gray-500 text-sm tracking-widest uppercase">
            Startup Expense Tracker
          </p>
          <div className="mt-3 flex justify-center gap-2 text-xs text-gray-600">
            <span>PLAYER SELECT</span>
            <span className="text-gray-700">▶</span>
            <span>INSERT COIN</span>
          </div>
        </div>

        {/* Login form card */}
        <div className="receipt-tape rounded-sm p-6 border border-[#222] relative overflow-hidden">
          {/* Receipt header */}
          <div className="text-center mb-6">
            <p className="text-gray-500 text-xs tracking-widest">━━━━━ AUTENTICACIÓN ━━━━━</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-2 tracking-wider uppercase">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="bro1 / bro2"
                required
                className="input-dark w-full px-4 py-3 rounded-sm text-sm"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 tracking-wider uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-dark w-full px-4 py-3 rounded-sm text-sm"
                style={{ fontFamily: "'Share Tech Mono', monospace" }}
              />
            </div>

            {error && (
              <div className="border border-red-900 bg-red-950/30 px-4 py-3 rounded-sm">
                <p className="text-red-400 text-xs tracking-wide">⚠ {error.toUpperCase()}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-neon-cyan w-full py-3 rounded-sm text-sm font-bold tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>VERIFICANDO...</span>
                </>
              ) : (
                '▶ INICIAR SESIÓN'
              )}
            </button>
          </form>

          {/* Receipt footer */}
          <div className="mt-6 pt-4 border-t border-dashed border-[#333] text-center">
            <p className="text-gray-600 text-xs tracking-widest">CASHBROS v0.1.0</p>
            <p className="text-gray-700 text-xs mt-1">© 2024 STARTUP HERMANOS</p>
          </div>
        </div>

        {/* Player cards hint */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div
            className="border border-[#00ffff30] rounded-sm p-3 text-center"
            style={{ background: 'rgba(0,255,255,0.03)' }}
          >
            <div className="text-2xl mb-1">💻</div>
            <div className="text-[#00ffff] text-xs tracking-wider">PLAYER 1</div>
            <div className="text-gray-500 text-xs">bro1</div>
          </div>
          <div
            className="border border-[#ff6b0030] rounded-sm p-3 text-center"
            style={{ background: 'rgba(255,107,0,0.03)' }}
          >
            <div className="text-2xl mb-1">🎨</div>
            <div className="text-[#ff6b00] text-xs tracking-wider">PLAYER 2</div>
            <div className="text-gray-500 text-xs">bro2</div>
          </div>
        </div>
      </div>
    </div>
  )
}
