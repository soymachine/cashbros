import { useState, type FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      // Auth state change in App.tsx will handle routing
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      } else if (msg.includes('too-many-requests')) {
        setError('Demasiados intentos fallidos. Inténtalo más tarde.')
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-4 relative overflow-hidden scanlines">
      {/* Ambient glow orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,255,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,0,0.04) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="w-full max-w-md z-10">
        {/* Terminal/Arcade login box */}
        <div
          className="border border-gray-800 p-8 relative"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #0d0d12 100%)',
            boxShadow: '0 0 40px rgba(0,255,255,0.08), 0 0 80px rgba(0,255,255,0.04)',
          }}
        >
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

          {/* Title */}
          <div className="text-center mb-8">
            <div
              className="text-5xl font-bold tracking-widest mb-1 cursor-blink"
              style={{
                color: '#00ffff',
                textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 40px #00ffff',
                animation: 'flicker 4s linear infinite',
              }}
            >
              💸 CASHBROS
            </div>
            <div className="text-gray-500 text-xs tracking-widest uppercase mt-2">
              Sistema de contabilidad entre hermanos
            </div>
            <div className="text-gray-700 text-xs mt-1 tracking-wider">
              v1.0.0 — ARCADE EDITION
            </div>
          </div>

          {/* Player cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div
              className="border p-4 text-center neon-border-cyan"
              style={{ borderColor: '#00ffff33', background: 'rgba(0,255,255,0.03)' }}
            >
              <div className="text-3xl mb-2">💻</div>
              <div className="text-xs text-cyan-400 tracking-widest">JUGADOR 1</div>
              <div className="text-xs text-gray-600 mt-1">Hermano 1</div>
            </div>
            <div
              className="border p-4 text-center neon-border-orange"
              style={{ borderColor: '#ff6b0033', background: 'rgba(255,107,0,0.03)' }}
            >
              <div className="text-3xl mb-2">🎨</div>
              <div className="text-xs text-orange-400 tracking-widest">JUGADOR 2</div>
              <div className="text-xs text-gray-600 mt-1">Hermano 2</div>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600 mb-6 tracking-widest">
            — Selecciona tu identidad... —
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 tracking-widest mb-1 uppercase">
                &gt; Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bro1@cashbros.app"
                required
                className="w-full px-3 py-2 border border-gray-800 text-sm text-gray-300 tracking-wider focus:border-cyan-900 transition-colors"
                style={{ background: '#0d0d0d', outline: 'none' }}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 tracking-widest mb-1 uppercase">
                &gt; Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-gray-800 text-sm text-gray-300 tracking-wider focus:border-cyan-900 transition-colors"
                style={{ background: '#0d0d0d', outline: 'none' }}
              />
            </div>

            {error && (
              <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-400 tracking-wide animate-slide-in">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-all disabled:opacity-50"
              style={{
                background: loading ? '#0d1a1a' : 'linear-gradient(135deg, #001a1a, #003333)',
                border: '1px solid #00ffff44',
                color: '#00ffff',
                boxShadow: loading ? 'none' : '0 0 20px rgba(0,255,255,0.15)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(0,255,255,0.3)'
                  e.currentTarget.style.borderColor = '#00ffff88'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,255,0.15)'
                e.currentTarget.style.borderColor = '#00ffff44'
              }}
            >
              {loading ? '> CONECTANDO...' : '> LOGIN'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-900 text-center text-xs text-gray-700 tracking-widest">
            INSERT COIN TO CONTINUE
          </div>
        </div>
      </div>
    </div>
  )
}
