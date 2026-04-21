import { useEffect, useState, type FormEvent } from 'react'
import { RopeCanvas } from '../components/RopeCanvas'
import { Select } from '../components/Select'
import { getTransactions, addTransaction, deleteTransaction } from '../lib/db'
import { computeBalance } from '../lib/balance'
import type { UserProfile, Transaction } from '../types'

type View = 'home' | 'transactions' | 'add' | 'settings'

interface HomeProps {
  currentUser: UserProfile
  otherUser: UserProfile
  onLogout: () => void
}

const CATEGORIES = [
  { value: 'general',         label: '📦 General' },
  { value: 'software',        label: '💾 Software' },
  { value: 'infraestructura', label: '🔧 Infraestructura' },
  { value: 'marketing',       label: '📣 Marketing' },
  { value: 'diseño',          label: '🎨 Diseño' },
  { value: 'reunión',         label: '🤝 Reunión' },
  { value: 'otro',            label: '❓ Otro' },
]

function formatEuro(n: number) {
  return `€${n.toFixed(2)}`
}
function formatDate(d: Date) {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')
}

// ─── NAV BAR ─────────────────────────────────────────────────────────────────

function NavBar({ active, onNavigate }: { active: View; onNavigate: (v: View) => void }) {
  const items: { view: View; icon: JSX.Element; label: string }[] = [
    {
      view: 'transactions',
      label: 'Registros',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6"  x2="21" y2="6"  />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6"  x2="3.01" y2="6"  />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
    {
      view: 'add',
      label: 'Añadir',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8"  y1="12" x2="16" y2="12" />
        </svg>
      ),
    },
    {
      view: 'settings',
      label: 'Ajustes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      {items.map(item => {
        const isActive = active === item.view
        return (
          <button
            key={item.view}
            onClick={() => onNavigate(active === item.view ? 'home' : item.view)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '12px 8px 10px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: isActive ? 'var(--text)' : 'var(--text-3)',
              transition: 'color 0.15s',
            }}
          >
            {item.icon}
            <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400', letterSpacing: '0.3px' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── ROPE VIEW ────────────────────────────────────────────────────────────────

function RopeView({ currentUser, otherUser, balance }: {
  currentUser: UserProfile
  otherUser: UserProfile
  balance: ReturnType<typeof computeBalance>
}) {
  const tensionLevel = Math.min(1, balance.amount / 200)

  let tensionDirection = 0
  if (!balance.isEven && balance.owingUser) {
    // Current user is at the TOP. If top user owes → pull up (-1). If bottom user owes → pull down (+1).
    tensionDirection = balance.owingUser.uid === currentUser.uid ? -1 : 1
  }

  const owingIsTop    = balance.owingUser?.uid === currentUser.uid
  const owingIsBottom = balance.owingUser?.uid === otherUser.uid

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top user (current) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: '20px',
        gap: '2px',
      }}>
        <span style={{ fontSize: '28px' }}>{currentUser.emoji}</span>
        <span style={{
          fontSize: '22px',
          fontWeight: '600',
          letterSpacing: '-0.5px',
          color: owingIsTop ? 'var(--red)' : 'var(--text)',
        }}>
          {currentUser.name}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
          {formatEuro(balance.user1.uid === currentUser.uid ? balance.totalPaidByUser1 : balance.totalPaidByUser2)} pagado
        </span>
        {owingIsTop && (
          <span style={{ fontSize: '12px', color: 'var(--red)', marginTop: '2px' }}>
            debe {formatEuro(balance.amount)}
          </span>
        )}
      </div>

      {/* Rope canvas */}
      <div style={{ height: '120px', position: 'relative' }}>
        <RopeCanvas tensionLevel={tensionLevel} tensionDirection={tensionDirection} />
        {/* Balance amount pill — shown at center when even */}
        {balance.isEven && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '11px',
            color: 'var(--text-3)',
            background: 'var(--bg)',
            padding: '2px 8px',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            pointerEvents: 'none',
          }}>
            equilibrio
          </div>
        )}
      </div>

      {/* Bottom user (other) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '20px',
        gap: '2px',
      }}>
        {otherUser.uid === 'placeholder' ? (
          <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Esperando al otro hermano…</span>
        ) : (
          <>
            <span style={{ fontSize: '28px' }}>{otherUser.emoji}</span>
            <span style={{
              fontSize: '22px',
              fontWeight: '600',
              letterSpacing: '-0.5px',
              color: owingIsBottom ? 'var(--red)' : 'var(--text)',
            }}>
              {otherUser.name}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              {formatEuro(balance.user1.uid === otherUser.uid ? balance.totalPaidByUser1 : balance.totalPaidByUser2)} pagado
            </span>
            {owingIsBottom && (
              <span style={{ fontSize: '12px', color: 'var(--red)', marginTop: '2px' }}>
                debe {formatEuro(balance.amount)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── TRANSACTIONS VIEW ───────────────────────────────────────────────────────

function TransactionsView({ transactions, currentUser, user1, onBack }: {
  transactions: Transaction[]
  currentUser: UserProfile
  user1: UserProfile
  onBack: () => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalGastado = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((s, tx) => s + tx.amount, 0)

  async function handleDelete(tx: Transaction) {
    setDeletingId(tx.id)
    try { await deleteTransaction(tx.id) }
    catch (e) { console.error(e) }
    finally { setDeletingId(null) }
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        gap: '12px',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: '15px', fontWeight: '600' }}>Registros</span>
      </div>

      {/* List */}
      <div className="font-receipt" style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
        {transactions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '48px 24px', fontSize: '13px', color: 'var(--text-3)' }}>
            Sin transacciones todavía
          </p>
        ) : (
          <>
            {transactions.map((tx, idx) => {
              const isOwn = tx.payerId === currentUser.uid
              const isSettlement = tx.type === 'settlement'
              const payerColor = tx.payerId === user1.uid ? '#0077cc' : '#d97706'

              return (
                <div key={tx.id}>
                  {idx > 0 && <div style={{ borderTop: '1px dashed rgba(0,0,0,0.06)', margin: '0 20px' }} />}
                  <div
                    style={{
                      padding: '12px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                      background: isSettlement ? 'rgba(217,119,6,0.03)' : 'transparent',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{formatDate(tx.createdAt)}</span>
                        {isSettlement && <span style={{ fontSize: '10px', color: 'var(--amber)' }}>⇄ nivelación</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: payerColor }}>{tx.payerName}</span>
                        <span style={{ color: 'var(--text-3)', fontSize: '10px' }}>·</span>
                        <span style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.description}
                        </span>
                      </div>
                      {!isSettlement && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '4px',
                          fontSize: '10px',
                          color: 'var(--text-3)',
                          background: 'rgba(0,0,0,0.04)',
                          borderRadius: '4px',
                          padding: '1px 6px',
                        }}>
                          {tx.category}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: isSettlement ? 'var(--amber)' : 'var(--text)' }}>
                        {formatEuro(tx.amount)}
                      </span>
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(tx)}
                          disabled={deletingId === tx.id}
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-3)',
                            background: 'transparent',
                            border: 'none',
                            cursor: deletingId === tx.id ? 'not-allowed' : 'pointer',
                            opacity: deletingId === tx.id ? 0.4 : 1,
                            padding: '2px 4px',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
                        >
                          {deletingId === tx.id ? '…' : '✕'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Footer */}
      {transactions.length > 0 && (
        <div className="font-receipt" style={{
          borderTop: '1px dashed rgba(0,0,0,0.1)',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--text-2)',
        }}>
          <span>TOTAL GASTADO</span>
          <span style={{ fontWeight: '700', color: 'var(--text)' }}>{formatEuro(totalGastado)}</span>
        </div>
      )}
    </div>
  )
}

// ─── ADD TRANSACTION VIEW ─────────────────────────────────────────────────────

function AddView({ currentUser, onBack }: { currentUser: UserProfile; onBack: () => void }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [type, setType] = useState<'expense' | 'settlement'>('expense')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) { setError('Introduce una cantidad válida.'); return }
    if (!description.trim()) { setError('Introduce una descripción.'); return }
    setSubmitting(true)
    try {
      await addTransaction({
        amount: num,
        description: description.trim(),
        category: type === 'settlement' ? 'otro' : category,
        type,
        payerId: currentUser.uid,
        payerName: currentUser.name,
      })
      setAmount('')
      setDescription('')
      setCategory('general')
      setType('expense')
      onBack()
    } catch (err) {
      setError('Error al guardar. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        gap: '12px',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: '15px', fontWeight: '600' }}>Nueva transacción</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {/* Type toggle */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'rgba(0,0,0,0.05)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '20px',
        }}>
          {(['expense', 'settlement'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              style={{
                padding: '9px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: 'all 0.15s',
                background: type === t ? 'var(--surface)' : 'transparent',
                color: type === t ? 'var(--text)' : 'var(--text-3)',
                boxShadow: type === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {t === 'expense' ? '💳 Gasto' : '⇄ Nivelación'}
            </button>
          ))}
        </div>

        {type === 'settlement' && (
          <div className="animate-slide-up" style={{
            background: 'rgba(217,119,6,0.07)',
            border: '1px solid rgba(217,119,6,0.2)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '13px',
            color: 'var(--amber)',
            marginBottom: '16px',
          }}>
            Pago directo para nivelar la balanza
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: type === 'expense' ? '1fr 1fr' : '1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '6px' }}>
                Cantidad (€)
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                autoFocus
              />
            </div>
            {type === 'expense' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '6px' }}>
                  Categoría
                </label>
                <Select value={category} onValueChange={setCategory} options={CATEGORIES} />
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-2)', marginBottom: '6px' }}>
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === 'settlement' ? 'Transferencia para nivelar…' : 'Dominio, Claude Code…'}
              required
            />
          </div>

          {error && (
            <p className="animate-slide-up" style={{ fontSize: '13px', color: 'var(--red)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              background: submitting ? 'rgba(0,0,0,0.04)' : 'var(--text)',
              color: submitting ? 'var(--text-3)' : 'var(--bg)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
              transition: 'opacity 0.15s',
              marginTop: '4px',
            }}
          >
            {submitting ? 'Guardando…' : 'Añadir'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────

function SettingsView({ currentUser, otherUser, onBack, onLogout }: {
  currentUser: UserProfile
  otherUser: UserProfile
  onBack: () => void
  onLogout: () => void
}) {
  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        gap: '12px',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: '4px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontSize: '15px', fontWeight: '600' }}>Ajustes</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profiles */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
            Participantes
          </p>
          {[currentUser, otherUser].map(u => (
            <div key={u.uid} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '24px' }}>{u.emoji}</span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600' }}>
                  {u.name} {u.uid === currentUser.uid && <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: '400' }}>(tú)</span>}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>{u.username}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Version */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            App
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>CashBros v0.2.0</p>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            color: 'var(--red)',
            border: '1px solid rgba(192,57,43,0.3)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background 0.15s',
            marginTop: 'auto',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

// ─── HOME (root) ──────────────────────────────────────────────────────────────

export default function Home({ currentUser, otherUser, onLogout }: HomeProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [view, setView] = useState<View>('home')

  // user1 = cyan (Dani), user2 = orange (Eric) — consistent for balance sign
  const user1 = currentUser.color === 'cyan' ? currentUser : otherUser
  const user2 = currentUser.color === 'orange' ? currentUser : otherUser

  useEffect(() => {
    return getTransactions(txs => setTransactions(txs))
  }, [])

  const balance = computeBalance(transactions, user1, user2)

  function navigate(v: View) {
    setView(v)
  }

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      maxWidth: '480px',
      margin: '0 auto',
      overflow: 'hidden',
    }}>
      {/* Main content area */}
      {view === 'home' && (
        <RopeView
          currentUser={currentUser}
          otherUser={otherUser}
          balance={balance}
        />
      )}
      {view === 'transactions' && (
        <TransactionsView
          transactions={transactions}
          currentUser={currentUser}
          user1={user1}
          onBack={() => setView('home')}
        />
      )}
      {view === 'add' && (
        <AddView currentUser={currentUser} onBack={() => setView('home')} />
      )}
      {view === 'settings' && (
        <SettingsView
          currentUser={currentUser}
          otherUser={otherUser}
          onBack={() => setView('home')}
          onLogout={onLogout}
        />
      )}

      {/* Nav bar */}
      <NavBar active={view} onNavigate={navigate} />
    </div>
  )
}
