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
        setError('Error al iniciar sesión.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 'max(32px, env(safe-area-inset-top))',
      paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
      paddingLeft: '24px',
      paddingRight: '24px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{ fontSize: '32px', marginBottom: '10px' }}>💸</p>
        <h1 style={{ fontSize: '22px', fontWeight: '700', letterSpacing: '-0.5px', color: 'var(--text)' }}>
          CashBros
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
          Contabilidad entre hermanos
        </p>
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: '340px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@cashbros.app"
            required
            autoComplete="email"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="animate-slide-up" style={{
              fontSize: '13px',
              color: 'var(--red)',
              textAlign: 'center',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              width: '100%',
              padding: '12px',
              background: loading ? 'rgba(0,0,0,0.04)' : 'var(--text)',
              color: loading ? 'var(--text-3)' : 'var(--bg)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
