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

// ─── DEBT LABEL (hero "debe €xxx.xx" with tension-linked underline) ──────────

function DebtLabel({ show, amount, tension, align }: {
  show: boolean
  amount: number
  tension: number
  align: 'left' | 'right'
}) {
  if (!show) return null
  const amountText = amount.toFixed(2)
  const underlinePct = Math.max(0.15, Math.min(1, tension)) * 100

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'left' ? 'flex-start' : 'flex-end',
      gap: '6px',
      marginBottom: align === 'left' ? '10px' : 0,
      marginTop: align === 'right' ? '10px' : 0,
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--text-3)',
      }}>
        debe
      </span>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '44px',
          fontWeight: 700,
          lineHeight: 1,
          color: 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}>
          <span style={{ color: 'var(--text-3)', fontWeight: 400, marginRight: '2px' }}>€</span>
          {amountText}
        </span>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: align === 'left' ? 0 : 'auto',
            right: align === 'right' ? 0 : 'auto',
            bottom: '-6px',
            height: '2px',
            width: `${underlinePct}%`,
            background: 'var(--red)',
            transition: 'width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />
      </div>
    </div>
  )
}

// ─── NAV BAR ─────────────────────────────────────────────────────────────────

function NavBar({ active, onNavigate }: { active: View; onNavigate: (v: View) => void }) {
  const items: { view: View; label: string; num: string }[] = [
    { view: 'transactions', label: 'registros', num: '01' },
    { view: 'add',          label: 'añadir',    num: '02' },
    { view: 'settings',     label: 'ajustes',   num: '03' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      borderTop: '1px solid var(--line)',
      background: 'var(--bg)',
      fontFamily: 'var(--font-mono)',
    }}>
      {items.map(item => {
        const isActive = active === item.view
        return (
          <button
            key={item.view}
            onClick={() => onNavigate(active === item.view ? 'home' : item.view)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '8px',
              padding: '18px 8px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              transition: 'opacity 0.2s',
              opacity: isActive ? 1 : 0.45,
            }}
          >
            <span style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              color: 'var(--text-3)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {item.num}
            </span>
            <span style={{
              position: 'relative',
              fontSize: '12px',
              fontWeight: isActive ? 700 : 500,
              letterSpacing: '0.02em',
              textTransform: 'lowercase',
            }}>
              {item.label}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: '-6px',
                  height: '1.5px',
                  background: 'var(--text)',
                  transformOrigin: 'left center',
                  transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── ROPE VIEW ────────────────────────────────────────────────────────────────

function RopeView({ currentUser, otherUser, balance, debugAmount, debugDirection }: {
  currentUser: UserProfile
  otherUser: UserProfile
  balance: ReturnType<typeof computeBalance>
  debugAmount: number | null
  debugDirection: number
}) {
  const isDebug = debugAmount !== null
  const effectiveAmount    = isDebug ? debugAmount! : balance.amount
  const effectiveDirection = isDebug ? debugDirection : (() => {
    if (balance.isEven || !balance.owingUser) return 0
    return balance.owingUser.uid === currentUser.uid ? -1 : 1
  })()

  const tensionLevel = Math.min(1, effectiveAmount / 200)

  const owingIsTop    = !isDebug && balance.owingUser?.uid === currentUser.uid
  const owingIsBottom = !isDebug && balance.owingUser?.uid === otherUser.uid

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

      {/* Canvas — full content area */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <RopeCanvas tensionLevel={tensionLevel} tensionDirection={effectiveDirection} />
      </div>

      {/* Top block — current user (aligned left) */}
      <div style={{
        position: 'absolute',
        top: '32px',
        left: '24px',
        right: '24px',
        textAlign: 'left',
        pointerEvents: 'none',
      }}>
        <DebtLabel show={owingIsTop} amount={balance.amount} tension={tensionLevel} align="left" />
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '84px',
          fontWeight: 900,
          fontStyle: owingIsTop ? 'italic' : 'normal',
          letterSpacing: '-0.045em',
          color: 'var(--text)',
          lineHeight: 0.92,
          fontOpticalSizing: 'auto',
        }}>
          {currentUser.name.toLowerCase()}
        </p>
      </div>

      {/* Bottom block — other user (aligned right) */}
      <div style={{
        position: 'absolute',
        bottom: '32px',
        left: '24px',
        right: '24px',
        textAlign: 'right',
        pointerEvents: 'none',
      }}>
        {otherUser.uid === 'placeholder' ? (
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '84px',
            fontWeight: 900,
            color: 'var(--text-3)',
            lineHeight: 0.92,
            letterSpacing: '-0.045em',
          }}>…</p>
        ) : (
          <>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '84px',
              fontWeight: 900,
              fontStyle: owingIsBottom ? 'italic' : 'normal',
              letterSpacing: '-0.045em',
              color: 'var(--text)',
              lineHeight: 0.92,
              fontOpticalSizing: 'auto',
            }}>
              {otherUser.name.toLowerCase()}
            </p>
            <DebtLabel show={owingIsBottom} amount={balance.amount} tension={tensionLevel} align="right" />
          </>
        )}
      </div>

      {/* Debug badge */}
      {isDebug && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '10px',
          color: '#9333ea',
          background: 'var(--bg)',
          padding: '2px 10px',
          borderRadius: '20px',
          border: '1px solid rgba(147,51,234,0.3)',
          pointerEvents: 'none',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
        }}>
          debug · €{debugAmount!.toFixed(0)}
        </div>
      )}
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

function SettingsView({ currentUser, otherUser, onBack, onLogout, debugAmount, debugDirection, setDebugAmount, setDebugDirection }: {
  currentUser: UserProfile
  otherUser: UserProfile
  onBack: () => void
  onLogout: () => void
  debugAmount: number | null
  debugDirection: number
  setDebugAmount: (v: number | null) => void
  setDebugDirection: (v: number) => void
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

        {/* Debug */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#9333ea', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Debug
            </p>
            {/* Toggle */}
            <button
              onClick={() => setDebugAmount(debugAmount === null ? 0 : null)}
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                border: 'none',
                cursor: 'pointer',
                background: debugAmount !== null ? '#9333ea' : 'rgba(0,0,0,0.12)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: debugAmount !== null ? '21px' : '3px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {debugAmount !== null && (
            <div className="animate-slide-up" style={{
              background: 'rgba(147,51,234,0.05)',
              border: '1px solid rgba(147,51,234,0.2)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}>
              {/* Amount slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', color: '#9333ea', fontFamily: 'monospace' }}>
                    balance ficticio
                  </label>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#9333ea', fontFamily: 'monospace' }}>
                    €{debugAmount.toFixed(0)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="1"
                  value={debugAmount}
                  onChange={e => setDebugAmount(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#9333ea',
                    cursor: 'pointer',
                    height: 'auto',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    borderRadius: 0,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'monospace' }}>€0</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'monospace' }}>€500</span>
                </div>
              </div>

              {/* Direction toggle */}
              <div>
                <label style={{ fontSize: '12px', color: '#9333ea', fontFamily: 'monospace', display: 'block', marginBottom: '8px' }}>
                  dirección
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '4px',
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '8px',
                  padding: '3px',
                }}>
                  {[
                    { value: -1, label: '↑ arriba' },
                    { value:  0, label: '— plana' },
                    { value:  1, label: '↓ abajo' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDebugDirection(opt.value)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        background: debugDirection === opt.value ? '#9333ea' : 'transparent',
                        color: debugDirection === opt.value ? 'white' : 'var(--text-3)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Version */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            App
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>CashBros v0.3.1</p>
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
  const [debugAmount, setDebugAmount] = useState<number | null>(null)
  const [debugDirection, setDebugDirection] = useState<number>(1)

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

  const isSub = view !== 'home'

  return (
    <div style={{
      height: '100dvh',
      background: 'var(--bg)',
      maxWidth: '480px',
      margin: '0 auto',
      overflow: 'hidden',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          transform: isSub ? 'translateY(-50%)' : 'translateY(0)',
          transition: 'transform 0.55s cubic-bezier(0.2, 0.85, 0.25, 1)',
          willChange: 'transform',
        }}>
          {/* Panel 1 — rope (full content height) */}
          <div style={{ height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
            <RopeView
              currentUser={currentUser}
              otherUser={otherUser}
              balance={balance}
              debugAmount={debugAmount}
              debugDirection={debugDirection}
            />
          </div>

          {/* Nav — travels between bottom (home) and top (sub) */}
          <div style={{ flexShrink: 0 }}>
            <NavBar active={view} onNavigate={navigate} />
          </div>

          {/* Panel 2 — subview (content height minus nav) */}
          <div style={{
            height: 'calc(100% - var(--nav-h))',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
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
                debugAmount={debugAmount}
                debugDirection={debugDirection}
                setDebugAmount={setDebugAmount}
                setDebugDirection={setDebugDirection}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
