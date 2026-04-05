import { useEffect, useState, type FormEvent } from 'react'
import { getTransactions, addTransaction, deleteTransaction } from '../lib/db'
import { computeBalance } from '../lib/balance'
import { Select } from '../components/Select'
import type { UserProfile, Transaction } from '../types'

interface DashboardProps {
  currentUser: UserProfile
  otherUser: UserProfile
  onLogout: () => void
}

const CATEGORIES = [
  { value: 'general',        label: '📦 General' },
  { value: 'software',       label: '💾 Software' },
  { value: 'infraestructura',label: '🔧 Infraestructura' },
  { value: 'marketing',      label: '📣 Marketing' },
  { value: 'diseño',         label: '🎨 Diseño' },
  { value: 'reunión',        label: '🤝 Reunión' },
  { value: 'otro',           label: '❓ Otro' },
]

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(',', '')
}

function formatEuro(amount: number): string {
  return `€${amount.toFixed(2)}`
}

export default function Dashboard({ currentUser, otherUser, onLogout }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [type, setType] = useState<'expense' | 'settlement'>('expense')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingTx, setDeletingTx] = useState<string | null>(null)

  // user1 is always cyan (Dani), user2 always amber (Eric) — for consistent balance sign
  const user1 = currentUser.color === 'cyan' ? currentUser : otherUser
  const user2 = currentUser.color === 'orange' ? currentUser : otherUser

  useEffect(() => {
    const unsubscribe = getTransactions((txs) => setTransactions(txs))
    return unsubscribe
  }, [])

  const balance = computeBalance(transactions, user1, user2)
  const currentUserOwes = balance.owingUser?.uid === currentUser.uid
  const currentUserIsOwed = balance.owedUser?.uid === currentUser.uid

  const totalGastado = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Introduce una cantidad válida mayor que 0.')
      return
    }
    if (!description.trim()) {
      setFormError('Introduce una descripción.')
      return
    }
    setSubmitting(true)
    try {
      await addTransaction({
        amount: amountNum,
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
    } catch (err) {
      setFormError('Error al añadir la transacción. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(tx: Transaction) {
    if (tx.payerId !== currentUser.uid) return
    setDeletingTx(tx.id)
    try {
      await deleteTransaction(tx.id)
    } catch (err) {
      console.error('Error deleting transaction:', err)
    } finally {
      setDeletingTx(null)
    }
  }

  const accentColor = currentUser.color === 'cyan' ? 'var(--cyan)' : 'var(--amber)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(9,9,11,0.8)',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '-0.3px' }}>
          💸 CashBros
        </span>
        <span style={{ fontSize: '13px', color: accentColor, fontWeight: '500' }}>
          {currentUser.emoji} {currentUser.name}
        </span>
        <button
          onClick={onLogout}
          style={{
            fontSize: '13px',
            color: 'var(--text-3)',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '5px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          Salir
        </button>
      </header>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Balance Card */}
        <div
          key={transactions.length}
          className="animate-balance-update"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '16px' }}>
            Balanza
          </p>

          {balance.isEven ? (
            <>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>⚖️</div>
              <p style={{ fontSize: '22px', fontWeight: '700', color: 'var(--green)', letterSpacing: '-0.5px' }}>
                Equilibrio perfecto
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>
                Las cuentas están al día
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '10px' }}>
                {balance.owingUser?.emoji} <strong style={{ color: 'var(--text-2)' }}>{balance.owingUser?.name}</strong>
                {' '}debe a{' '}
                {balance.owedUser?.emoji} <strong style={{ color: 'var(--text-2)' }}>{balance.owedUser?.name}</strong>
              </p>
              <p
                style={{
                  fontSize: '56px',
                  fontWeight: '700',
                  letterSpacing: '-2px',
                  lineHeight: 1,
                  color: currentUserOwes ? 'var(--red)' : currentUserIsOwed ? 'var(--green)' : 'var(--text)',
                  marginBottom: '10px',
                }}
              >
                {formatEuro(balance.amount)}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                {currentUserOwes
                  ? `Le debes ${formatEuro(balance.amount)} a ${balance.owedUser?.name}`
                  : currentUserIsOwed
                  ? `${balance.owingUser?.name} te debe ${formatEuro(balance.amount)}`
                  : ''}
              </p>
            </>
          )}
        </div>

        {/* Player Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '10px', alignItems: 'center' }}>
          {/* user1 - Dani */}
          <PlayerCard
            user={user1}
            totalPaid={balance.totalPaidByUser1}
            isCurrentUser={user1.uid === currentUser.uid}
            color="var(--cyan)"
          />

          <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '18px', fontWeight: '300' }}>
            ⇄
          </div>

          {/* user2 - Eric */}
          <PlayerCard
            user={user2}
            totalPaid={balance.totalPaidByUser2}
            isCurrentUser={user2.uid === currentUser.uid}
            color="var(--amber)"
          />
        </div>

        {/* Add Transaction Form */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)', marginBottom: '16px' }}>
            Nueva transacción
          </p>

          {/* Type toggle */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              background: 'var(--surface-2)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '16px',
            }}
          >
            {(['expense', 'settlement'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  padding: '8px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.15s',
                  background: type === t ? 'var(--surface)' : 'transparent',
                  color: type === t ? 'var(--text)' : 'var(--text-3)',
                  boxShadow: type === t ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                {t === 'expense' ? '💳 Gasto' : '⇄ Nivelación'}
              </button>
            ))}
          </div>

          {type === 'settlement' && (
            <div
              className="animate-slide-in"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--amber)',
                marginBottom: '14px',
              }}
            >
              Pago directo para nivelar la balanza
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: type === 'expense' ? '1fr 1fr' : '1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-3)', marginBottom: '6px' }}>
                  Cantidad (€)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              {type === 'expense' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-3)', marginBottom: '6px' }}>
                    Categoría
                  </label>
                  <Select
                    value={category}
                    onValueChange={setCategory}
                    options={CATEGORIES}
                    placeholder="Selecciona..."
                  />
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: 'var(--text-3)', marginBottom: '6px' }}>
                Descripción
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={type === 'settlement' ? 'Transferencia para nivelar...' : 'Dominio, Claude Code, diseño...'}
                required
              />
            </div>

            {formError && (
              <div
                className="animate-slide-in"
                style={{
                  background: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.2)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--red)',
                }}
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '11px',
                background: submitting ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: submitting ? 'var(--text-3)' : 'var(--text)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                marginTop: '2px',
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }}
            >
              {submitting ? 'Guardando...' : 'Añadir'}
            </button>
          </form>
        </div>

        {/* Receipt */}
        <div
          className="font-receipt"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {/* Receipt header */}
          <div
            style={{
              textAlign: 'center',
              padding: '16px',
              borderBottom: '1px dashed rgba(255,255,255,0.08)',
            }}
          >
            <p style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--text-3)' }}>
              ─────────────────────
            </p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-2)', letterSpacing: '2px', margin: '4px 0 2px' }}>
              CASHBROS
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '2px' }}>
              TICKET DE GASTOS
            </p>
            <p style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--text-3)', marginTop: '4px' }}>
              ─────────────────────
            </p>
          </div>

          {/* Transactions */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {transactions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px', fontSize: '12px', color: 'var(--text-3)', letterSpacing: '2px' }}>
                — SIN TRANSACCIONES —
              </p>
            ) : (
              transactions.map((tx, idx) => {
                const isOwn = tx.payerId === currentUser.uid
                const isSettlement = tx.type === 'settlement'
                const isDeleting = deletingTx === tx.id
                const payerColor = tx.payerId === user1.uid ? 'var(--cyan)' : 'var(--amber)'
                const payerEmoji = tx.payerId === user1.uid ? user1.emoji : user2.emoji

                return (
                  <div key={tx.id}>
                    {idx > 0 && (
                      <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', margin: '0 16px' }} />
                    )}
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                        background: isSettlement ? 'rgba(245,158,11,0.03)' : 'transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSettlement) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSettlement ? 'rgba(245,158,11,0.03)' : 'transparent'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                            {formatDate(tx.createdAt)}
                          </span>
                          {isSettlement && (
                            <span style={{ fontSize: '10px', color: 'var(--amber)', letterSpacing: '1px' }}>
                              ⇄ NIVELACIÓN
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px' }}>{payerEmoji}</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: payerColor }}>
                            {tx.payerName}
                          </span>
                          <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>·</span>
                          <span style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.description}
                          </span>
                        </div>
                        {!isSettlement && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              fontSize: '10px',
                              color: 'var(--text-3)',
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: '4px',
                              padding: '1px 6px',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {tx.category}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: isSettlement ? 'var(--amber)' : 'var(--text)',
                          }}
                        >
                          {formatEuro(tx.amount)}
                        </span>

                        {isOwn && (
                          <button
                            onClick={() => handleDelete(tx)}
                            disabled={isDeleting}
                            title="Eliminar"
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-3)',
                              background: 'transparent',
                              border: '1px solid transparent',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              cursor: isDeleting ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s',
                              opacity: isDeleting ? 0.4 : 1,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = 'var(--red)'
                              e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'
                              e.currentTarget.style.background = 'rgba(248,113,113,0.08)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-3)'
                              e.currentTarget.style.borderColor = 'transparent'
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            {isDeleting ? '…' : '✕'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: '1px dashed rgba(255,255,255,0.08)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-3)', letterSpacing: '1px' }}>TOTAL GASTADO</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-2)' }}>{formatEuro(totalGastado)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', letterSpacing: '1px' }}>TRANSACCIONES</span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{transactions.length}</span>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-3)', paddingBottom: '16px' }}>
          💸 CashBros — Contabilidad entre hermanos
        </p>
      </div>
    </div>
  )
}

interface PlayerCardProps {
  user: UserProfile
  totalPaid: number
  isCurrentUser: boolean
  color: string
}

function PlayerCard({ user, totalPaid, isCurrentUser, color }: PlayerCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${color}`,
        borderRadius: '12px',
        padding: '16px',
        textAlign: 'center',
        position: 'relative',
        opacity: isCurrentUser ? 1 : 0.75,
      }}
    >
      {isCurrentUser && (
        <span
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            fontWeight: '600',
            color,
            background: 'var(--bg)',
            padding: '0 6px',
            letterSpacing: '1px',
          }}
        >
          TÚ
        </span>
      )}
      <div style={{ fontSize: '26px', marginBottom: '6px' }}>{user.emoji}</div>
      <div style={{ fontSize: '13px', fontWeight: '600', color }}>{user.name}</div>
      <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginTop: '6px' }}>
        {formatEuro(totalPaid)}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>pagado</div>
    </div>
  )
}
