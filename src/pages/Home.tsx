import { useEffect, useState, type FormEvent, type ReactNode, type CSSProperties } from 'react'
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

function formatDate(d: Date) {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')
}

// ─── SHARED EDITORIAL STYLES ─────────────────────────────────────────────────

const metaLabelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: 'var(--text-3)',
}

const sectionTitleStyle = {
  ...metaLabelStyle,
  display: 'block',
  marginBottom: '14px',
}

function SubViewHeader({ label, onBack, right }: {
  label: string
  onBack: () => void
  right?: ReactNode
}) {
  return (
    <div style={{
      padding: '22px 24px 14px',
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--line)',
      gap: '16px',
    }}>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          ...metaLabelStyle,
        }}
        aria-label="Volver"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>{label}</span>
      </button>
      {right && <div>{right}</div>}
    </div>
  )
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

function TransactionsView({ transactions, currentUser, user1, user2, onBack }: {
  transactions: Transaction[]
  currentUser: UserProfile
  user1: UserProfile
  user2: UserProfile
  onBack: () => void
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const totalGastado = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((s, tx) => s + tx.amount, 0)

  async function handleDelete(tx: Transaction) {
    setDeletingId(tx.id)
    try { await deleteTransaction(tx.id) }
    catch (e) { console.error(e) }
    finally { setDeletingId(null); setConfirmingId(null) }
  }

  // user1 -> first color marker, other -> second. Neutral squares to signal identity without color noise.
  function payerMarker(tx: Transaction) {
    const isUser1 = tx.payerId === user1.uid
    return (
      <span style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        background: isUser1 ? 'var(--text)' : 'var(--red)',
        marginRight: '8px',
        verticalAlign: 'middle',
        transform: 'translateY(-1px)',
      }} />
    )
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SubViewHeader
        label={`registros · ${transactions.length.toString().padStart(2, '0')}`}
        onBack={onBack}
        right={
          <span style={metaLabelStyle}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', background: 'var(--text)', marginRight: '6px', transform: 'translateY(-1px)' }} />
            {user1.name.toLowerCase()}
            <span style={{ display: 'inline-block', width: '6px', height: '6px', background: 'var(--red)', marginRight: '6px', marginLeft: '14px', transform: 'translateY(-1px)' }} />
            {user2.name.toLowerCase()}
          </span>
        }
      />

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {transactions.length === 0 ? (
          <p style={{
            textAlign: 'center',
            padding: '64px 24px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}>
            sin transacciones
          </p>
        ) : (
          transactions.map((tx, idx) => {
            const isOwn = tx.payerId === currentUser.uid
            const isSettlement = tx.type === 'settlement'
            const isConfirming = confirmingId === tx.id
            const isDeleting = deletingId === tx.id

            return (
              <div
                key={tx.id}
                style={{
                  padding: '16px 24px',
                  borderTop: idx === 0 ? 'none' : '1px solid var(--line)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  columnGap: '16px',
                  rowGap: '6px',
                  alignItems: 'baseline',
                }}
              >
                {/* Row 1: date + amount */}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                }}>
                  {String(idx + 1).padStart(2, '0')} · {formatDate(tx.createdAt)}
                  {isSettlement && <span style={{ marginLeft: '8px', color: 'var(--red)' }}>· nivelación</span>}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '22px',
                  fontWeight: 700,
                  lineHeight: 1,
                  color: 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}>
                  <span style={{ color: 'var(--text-3)', fontWeight: 400, marginRight: '2px' }}>€</span>
                  {tx.amount.toFixed(2)}
                </span>

                {/* Row 2: payer + description + delete */}
                <span style={{
                  fontSize: '14px',
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}>
                  {payerMarker(tx)}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginRight: '8px' }}>
                    {tx.payerName.toLowerCase()}
                  </span>
                  <span>{tx.description}</span>
                </span>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                }}>
                  {!isSettlement && <span>{tx.category}</span>}
                  {isOwn && (
                    isConfirming ? (
                      <button
                        onClick={() => handleDelete(tx)}
                        disabled={isDeleting}
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          background: 'var(--red)',
                          color: '#fff',
                          border: 'none',
                          padding: '3px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        {isDeleting ? '…' : 'borrar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(tx.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-3)',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '0 2px',
                          lineHeight: 1,
                        }}
                        aria-label="Eliminar"
                      >
                        ×
                      </button>
                    )
                  )}
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Footer total */}
      {transactions.length > 0 && (
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '18px 24px 22px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}>
            total gastado
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '28px',
            fontWeight: 700,
            lineHeight: 1,
            color: 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}>
            <span style={{ color: 'var(--text-3)', fontWeight: 400, marginRight: '2px' }}>€</span>
            {totalGastado.toFixed(2)}
          </span>
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

  const inputBase: CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--line)',
    borderRadius: 0,
    padding: '10px 0',
    fontSize: '16px',
    color: 'var(--text)',
    outline: 'none',
  }

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SubViewHeader
        label={type === 'settlement' ? 'añadir · nivelación' : 'añadir · gasto'}
        onBack={onBack}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {/* Type toggle — minimal text with animated underline */}
        <div style={{ display: 'flex', gap: '28px', marginBottom: '28px' }}>
          {(['expense', 'settlement'] as const).map(t => {
            const isActive = type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  position: 'relative',
                  background: 'transparent',
                  border: 'none',
                  padding: '2px 0',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--text)',
                  opacity: isActive ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
              >
                {t === 'expense' ? 'gasto' : 'nivelación'}
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 0, right: 0, bottom: '-4px',
                    height: '1.5px',
                    background: 'var(--text)',
                    transformOrigin: 'left center',
                    transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                    transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                />
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Amount — hero field */}
          <div>
            <label style={{ ...metaLabelStyle, display: 'block', marginBottom: '8px' }}>
              cantidad
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', gap: '6px', borderBottom: '1px solid var(--line)' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '28px',
                fontWeight: 400,
                color: 'var(--text-3)',
              }}>€</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                autoFocus
                inputMode="decimal"
                style={{
                  ...inputBase,
                  borderBottom: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '28px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  padding: '8px 0',
                }}
              />
            </div>
          </div>

          {type === 'expense' && (
            <div>
              <label style={{ ...metaLabelStyle, display: 'block', marginBottom: '8px' }}>
                categoría
              </label>
              <Select value={category} onValueChange={setCategory} options={CATEGORIES} />
            </div>
          )}

          <div>
            <label style={{ ...metaLabelStyle, display: 'block', marginBottom: '8px' }}>
              descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === 'settlement' ? 'Transferencia para nivelar…' : 'Dominio, Claude Code…'}
              required
              style={inputBase}
            />
          </div>

          {type === 'settlement' && (
            <p className="animate-slide-up" style={{
              ...metaLabelStyle,
              color: 'var(--red)',
              letterSpacing: '0.18em',
            }}>
              pago directo para nivelar la balanza
            </p>
          )}

          {error && (
            <p className="animate-slide-up" style={{
              ...metaLabelStyle,
              color: 'var(--red)',
              letterSpacing: '0.14em',
              textTransform: 'none',
              fontSize: '12px',
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '18px',
              marginTop: '8px',
              background: submitting ? 'var(--text-3)' : 'var(--text)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'guardando…' : '→  añadir'}
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
  const debugOn = debugAmount !== null
  const participants = [
    { u: currentUser, color: 'var(--text)' as const },
    { u: otherUser,   color: 'var(--red)'  as const },
  ]

  return (
    <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <SubViewHeader label="ajustes" onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Participantes */}
        <section>
          <span style={sectionTitleStyle}>participantes</span>
          {participants.map(({ u, color }) => (
            <div key={u.uid} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '14px',
              padding: '14px 0',
              borderTop: '1px solid var(--line)',
            }}>
              <span style={{
                display: 'inline-block',
                width: '8px', height: '8px',
                background: color,
                flexShrink: 0,
                transform: 'translateY(1px)',
              }} />
              <span style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: 'var(--text)',
              }}>
                {u.name.toLowerCase()}
                {u.uid === currentUser.uid && (
                  <span style={{ ...metaLabelStyle, marginLeft: '10px' }}>(tú)</span>
                )}
              </span>
              <span style={metaLabelStyle}>@{u.username}</span>
            </div>
          ))}
        </section>

        {/* Debug */}
        <section>
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: '14px',
          }}>
            <span style={metaLabelStyle}>debug</span>
            <button
              onClick={() => setDebugAmount(debugOn ? null : 0)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: debugOn ? 'var(--red)' : 'var(--text-3)',
              }}
            >
              {debugOn ? '● on' : '○ off'}
            </button>
          </div>

          {debugOn && (
            <div className="animate-slide-up" style={{
              borderTop: '1px solid var(--line)',
              paddingTop: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                  <span style={metaLabelStyle}>balance ficticio</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    <span style={{ color: 'var(--text-3)', fontWeight: 400, marginRight: '2px' }}>€</span>
                    {debugAmount!.toFixed(0)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="1"
                  value={debugAmount!}
                  onChange={e => setDebugAmount(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--red)',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 0,
                    padding: 0,
                  }}
                />
              </div>

              <div>
                <span style={{ ...sectionTitleStyle, marginBottom: '10px' }}>dirección</span>
                <div style={{ display: 'flex', gap: '24px' }}>
                  {[
                    { value: -1, label: 'arriba' },
                    { value:  0, label: 'plana'  },
                    { value:  1, label: 'abajo'  },
                  ].map(opt => {
                    const isActive = debugDirection === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDebugDirection(opt.value)}
                        style={{
                          position: 'relative',
                          background: 'transparent',
                          border: 'none',
                          padding: '2px 0',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          fontWeight: isActive ? 700 : 500,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: 'var(--text)',
                          opacity: isActive ? 1 : 0.4,
                          transition: 'opacity 0.2s',
                        }}
                      >
                        {opt.label}
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            left: 0, right: 0, bottom: '-4px',
                            height: '1.5px',
                            background: 'var(--text)',
                            transformOrigin: 'left center',
                            transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                            transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Version */}
        <section style={{ marginTop: 'auto' }}>
          <span style={sectionTitleStyle}>app</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.08em',
            color: 'var(--text-2)',
          }}>
            cashbros · v0.3.4
          </span>
        </section>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '18px',
            background: 'transparent',
            color: 'var(--red)',
            border: '1px solid var(--red)',
            borderRadius: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--red)' }}
        >
          cerrar sesión
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
          left: 0,
          right: 0,
          top: isSub ? 'calc(-100% + var(--nav-h))' : '0',
          height: 'calc(200% - var(--nav-h))',
          display: 'flex',
          flexDirection: 'column',
          transition: 'top 0.55s cubic-bezier(0.2, 0.85, 0.25, 1)',
          willChange: 'top',
        }}>
          {/* Panel 1 — rope (viewport minus nav) */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <RopeView
              currentUser={currentUser}
              otherUser={otherUser}
              balance={balance}
              debugAmount={debugAmount}
              debugDirection={debugDirection}
            />
          </div>

          {/* Nav — travels between bottom (home) and top (sub) */}
          <div style={{ height: 'var(--nav-h)', flexShrink: 0 }}>
            <NavBar active={view} onNavigate={navigate} />
          </div>

          {/* Panel 2 — subview (viewport minus nav) */}
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {view === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                currentUser={currentUser}
                user1={user1}
                user2={user2}
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
