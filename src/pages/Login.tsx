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
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Credenciales incorrectas.')
      } else if (msg.includes('too-many-requests')) {
        setError('Demasiados intentos. Inténtalo más tarde.')
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>💸</div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '700',
              letterSpacing: '-0.5px',
              color: 'var(--text)',
              margin: 0,
            }}
          >
            CashBros
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '14px', marginTop: '6px' }}>
            Contabilidad entre hermanos
          </p>
        </div>

        {/* Player cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '32px' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--cyan)',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>💻</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cyan)' }}>Dani</div>
          </div>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--amber)',
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎨</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--amber)' }}>Eric</div>
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '28px',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dani@cashbros.app"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '6px' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div
                className="animate-slide-in"
                style={{
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.25)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--red)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                background: loading ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: loading ? 'var(--text-3)' : 'var(--text)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                marginTop: '4px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
