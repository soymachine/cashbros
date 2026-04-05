import { useEffect, useState, type FormEvent } from 'react'
import { getTransactions, addTransaction, deleteTransaction } from '../lib/db'
import { computeBalance } from '../lib/balance'
import type { UserProfile, Transaction } from '../types'

interface DashboardProps {
  currentUser: UserProfile
  otherUser: UserProfile
  onLogout: () => void
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'software', label: 'Software' },
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'diseño', label: 'Diseño' },
  { value: 'reunión', label: 'Reunión' },
  { value: 'otro', label: 'Otro' },
]

const CATEGORY_EMOJI: Record<string, string> = {
  general: '📦',
  software: '💾',
  infraestructura: '🔧',
  marketing: '📣',
  diseño: '🎨',
  reunión: '🤝',
  otro: '❓',
}

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
  const [hoveredTx, setHoveredTx] = useState<string | null>(null)
  const [deletingTx, setDeletingTx] = useState<string | null>(null)

  // Determine user1 (bro1) and user2 (bro2) for balance computation
  const user1 = currentUser.username === 'bro1' ? currentUser : otherUser
  const user2 = currentUser.username === 'bro2' ? currentUser : otherUser

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

  const currentColor = currentUser.color === 'cyan' ? '#00ffff' : '#ff6b00'

  return (
    <div className="min-h-screen bg-grid text-gray-200 flex flex-col">
      {/* ── Header ── */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-gray-800"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      >
        <div
          className="text-sm font-bold tracking-widest"
          style={{ color: '#00ffff', textShadow: '0 0 10px #00ffff' }}
        >
          💸 CASHBROS
        </div>
        <div className="text-sm tracking-wider" style={{ color: currentColor }}>
          {currentUser.emoji} {currentUser.name.toUpperCase()}
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-gray-600 hover:text-gray-400 border border-gray-800 hover:border-gray-600 px-2 py-1 tracking-widest transition-colors"
        >
          SALIR
        </button>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* ── Balance Section ── */}
        <div
          className="border p-6 text-center relative"
          style={{
            background: 'linear-gradient(135deg, #080808 0%, #0d0d10 100%)',
            borderColor: '#1a1a1a',
            boxShadow: balance.isEven
              ? '0 0 20px rgba(0,255,65,0.1)'
              : currentUserOwes
              ? '0 0 20px rgba(255,0,64,0.1)'
              : '0 0 20px rgba(0,255,65,0.1)',
          }}
        >
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gray-700" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gray-700" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gray-700" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gray-700" />

          <div className="text-xs text-gray-600 tracking-widest mb-3 uppercase">
            — Estado de la Balanza —
          </div>

          {balance.isEven ? (
            <div>
              <div
                className="text-3xl font-bold tracking-widest animate-glow-pulse"
                style={{ color: '#00ff41', textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41' }}
              >
                ⚖️ EQUILIBRIO PERFECTO
              </div>
              <div className="text-xs text-gray-600 mt-2 tracking-wider">
                Las cuentas están al día
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs text-gray-500 tracking-widest mb-2">
                {balance.owingUser?.emoji} {balance.owingUser?.name.toUpperCase()} DEBE A{' '}
                {balance.owedUser?.emoji} {balance.owedUser?.name.toUpperCase()}
              </div>
              <div
                className="text-6xl font-bold tracking-wider animate-glow-pulse"
                style={{
                  color: currentUserOwes ? '#ff0040' : currentUserIsOwed ? '#00ff41' : '#e0e0e0',
                  textShadow: currentUserOwes
                    ? '0 0 10px #ff0040, 0 0 20px #ff0040'
                    : '0 0 10px #00ff41, 0 0 20px #00ff41',
                }}
              >
                {formatEuro(balance.amount)}
              </div>
              <div className="text-xs text-gray-500 mt-2 tracking-wider">
                {currentUserOwes
                  ? `⚠ Debes ${formatEuro(balance.amount)} a ${balance.owedUser?.name}`
                  : currentUserIsOwed
                  ? `✓ ${balance.owingUser?.name} te debe ${formatEuro(balance.amount)}`
                  : 'Ver balance arriba'}
              </div>
            </div>
          )}
        </div>

        {/* ── Player Cards ── */}
        <div className="grid grid-cols-2 gap-3 items-center">
          {/* User 1 card (bro1 / cyan) */}
          <div
            className="border p-4 text-center relative"
            style={{
              borderColor: user1.uid === currentUser.uid ? '#00ffff55' : '#00ffff1a',
              background: user1.uid === currentUser.uid
                ? 'rgba(0,255,255,0.04)'
                : 'rgba(0,255,255,0.01)',
              boxShadow: user1.uid === currentUser.uid
                ? '0 0 15px rgba(0,255,255,0.15)'
                : '0 0 5px rgba(0,255,255,0.05)',
              transition: 'all 0.3s',
            }}
          >
            {user1.uid === currentUser.uid && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-cyan-400 bg-black px-1 tracking-widest">
                TÚ
              </div>
            )}
            <div className="text-3xl mb-1">{user1.emoji}</div>
            <div className="text-xs text-cyan-400 tracking-widest">{user1.name.toUpperCase()}</div>
            <div className="text-sm font-bold mt-1" style={{ color: '#00ffff' }}>
              {formatEuro(balance.totalPaidByUser1)}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">total pagado</div>
          </div>

          <div className="text-center text-gray-600 text-xl font-bold">⇄</div>

          {/* User 2 card (bro2 / orange) — spans only 1 col, but grid is 2-col */}
          <div
            className="border p-4 text-center relative col-start-2 row-start-1"
            style={{
              borderColor: user2.uid === currentUser.uid ? '#ff6b0055' : '#ff6b001a',
              background: user2.uid === currentUser.uid
                ? 'rgba(255,107,0,0.04)'
                : 'rgba(255,107,0,0.01)',
              boxShadow: user2.uid === currentUser.uid
                ? '0 0 15px rgba(255,107,0,0.15)'
                : '0 0 5px rgba(255,107,0,0.05)',
              transition: 'all 0.3s',
            }}
          >
            {user2.uid === currentUser.uid && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-orange-400 bg-black px-1 tracking-widest">
                TÚ
              </div>
            )}
            <div className="text-3xl mb-1">{user2.emoji}</div>
            <div className="text-xs text-orange-400 tracking-widest">{user2.name.toUpperCase()}</div>
            <div className="text-sm font-bold mt-1" style={{ color: '#ff6b00' }}>
              {formatEuro(balance.totalPaidByUser2)}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">total pagado</div>
          </div>
        </div>

        {/* ── Add Transaction Form ── */}
        <div
          className="border border-gray-800 p-4"
          style={{ background: 'rgba(5,5,5,0.9)' }}
        >
          <div className="text-xs text-gray-500 tracking-widest mb-4 uppercase">
            &gt; Nueva Transacción
          </div>

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setType('expense')}
              className="py-2 text-xs tracking-widest uppercase transition-all"
              style={{
                border: type === 'expense' ? '1px solid #00ffff44' : '1px solid #222',
                background: type === 'expense' ? 'rgba(0,255,255,0.08)' : 'transparent',
                color: type === 'expense' ? '#00ffff' : '#555',
                boxShadow: type === 'expense' ? '0 0 10px rgba(0,255,255,0.1)' : 'none',
              }}
            >
              💳 GASTO
            </button>
            <button
              type="button"
              onClick={() => setType('settlement')}
              className="py-2 text-xs tracking-widest uppercase transition-all"
              style={{
                border: type === 'settlement' ? '1px solid #ff6b0044' : '1px solid #222',
                background: type === 'settlement' ? 'rgba(255,107,0,0.08)' : 'transparent',
                color: type === 'settlement' ? '#ff6b00' : '#555',
                boxShadow: type === 'settlement' ? '0 0 10px rgba(255,107,0,0.1)' : 'none',
              }}
            >
              ⇄ NIVELACIÓN
            </button>
          </div>

          {type === 'settlement' && (
            <div
              className="border px-3 py-2 text-xs text-gray-500 tracking-wide mb-4 animate-slide-in"
              style={{ borderColor: '#ff6b0022', background: 'rgba(255,107,0,0.03)' }}
            >
              💸 Pago directo para nivelar la balanza
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 tracking-widest mb-1">
                  CANTIDAD (€)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-800 text-sm text-gray-300 tracking-wider focus:border-gray-600 transition-colors"
                  style={{ background: '#0d0d0d', outline: 'none' }}
                />
              </div>

              {type === 'expense' && (
                <div>
                  <label className="block text-xs text-gray-600 tracking-widest mb-1">
                    CATEGORÍA
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-800 text-sm text-gray-300 tracking-wider focus:border-gray-600 transition-colors"
                    style={{ background: '#0d0d0d', outline: 'none' }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {CATEGORY_EMOJI[c.value]} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-600 tracking-widest mb-1">
                DESCRIPCIÓN
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'settlement' ? 'Transferencia para nivelar...' : 'Dominio, servidor, diseño...'
                }
                required
                className="w-full px-3 py-2 border border-gray-800 text-sm text-gray-300 tracking-wider focus:border-gray-600 transition-colors"
                style={{ background: '#0d0d0d', outline: 'none' }}
              />
            </div>

            {formError && (
              <div className="border border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-400 tracking-wide animate-slide-in">
                ⚠ {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 text-sm font-bold tracking-widest uppercase transition-all disabled:opacity-50"
              style={{
                background: submitting
                  ? '#0a1a0a'
                  : 'linear-gradient(135deg, #0a1a0a, #0d2a0d)',
                border: '1px solid #00ff4144',
                color: '#00ff41',
                boxShadow: submitting ? 'none' : '0 0 15px rgba(0,255,65,0.15)',
              }}
            >
              {submitting ? '> PROCESANDO...' : '> AÑADIR'}
            </button>
          </form>
        </div>

        {/* ── Receipt Section ── */}
        <div
          className="border border-gray-800"
          style={{ background: 'rgba(3,3,3,0.95)' }}
        >
          {/* Receipt header */}
          <div className="text-center py-4 border-b border-dashed border-gray-800 px-4">
            <div className="text-xs tracking-widest text-gray-500">
              ━━━━━━━━━━━━━━━━━━━━━━━━
            </div>
            <div className="text-sm tracking-widest text-gray-400 font-bold mt-1">
              CASHBROS
            </div>
            <div className="text-xs tracking-widest text-gray-600 mt-0.5">
              TICKET DE GASTOS
            </div>
            <div className="text-xs tracking-widest text-gray-700 mt-0.5">
              ━━━━━━━━━━━━━━━━━━━━━━━━
            </div>
          </div>

          {/* Transaction list */}
          <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-700 text-xs tracking-widest">
                — SIN TRANSACCIONES —
              </div>
            ) : (
              transactions.map((tx, idx) => {
                const isOwn = tx.payerId === currentUser.uid
                const isSettlement = tx.type === 'settlement'
                const isHovered = hoveredTx === tx.id
                const isDeleting = deletingTx === tx.id

                const payerColor =
                  tx.payerId === user1.uid ? '#00ffff' : '#ff6b00'

                return (
                  <div key={tx.id}>
                    {idx > 0 && (
                      <div className="receipt-dashed-light mx-4" />
                    )}
                    <div
                      className="px-4 py-3 relative transition-colors cursor-default"
                      style={{
                        background: isSettlement
                          ? 'rgba(255,107,0,0.02)'
                          : isHovered
                          ? 'rgba(255,255,255,0.02)'
                          : 'transparent',
                      }}
                      onMouseEnter={() => setHoveredTx(tx.id)}
                      onMouseLeave={() => setHoveredTx(null)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-gray-700">
                              {formatDate(tx.createdAt)}
                            </span>
                            {isSettlement && (
                              <span className="text-xs text-orange-700">⇄ NIVELACIÓN</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className="text-xs font-bold"
                              style={{ color: payerColor, opacity: 0.8 }}
                            >
                              {tx.payerId === user1.uid ? user1.emoji : user2.emoji}
                            </span>
                            <span
                              className="text-xs truncate"
                              style={{ color: payerColor, opacity: 0.7 }}
                            >
                              {tx.payerName.toUpperCase()}
                            </span>
                            <span className="text-gray-600 text-xs">·</span>
                            <span className="text-sm text-gray-300 truncate">
                              {tx.description}
                            </span>
                          </div>
                          {!isSettlement && (
                            <div className="mt-0.5">
                              <span
                                className="text-xs px-1 py-0.5 rounded-sm"
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  color: '#666',
                                  border: '1px solid #222',
                                }}
                              >
                                {CATEGORY_EMOJI[tx.category] ?? '📦'} {tx.category}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-sm font-bold"
                            style={{ color: isSettlement ? '#ff6b00' : '#e0e0e0' }}
                          >
                            {formatEuro(tx.amount)}
                          </span>

                          {/* Delete button — only own transactions */}
                          {isOwn && (
                            <button
                              onClick={() => handleDelete(tx)}
                              disabled={isDeleting}
                              className="text-xs px-1.5 py-0.5 transition-all"
                              style={{
                                color: isHovered ? '#ff0040' : 'transparent',
                                border: isHovered ? '1px solid #ff004033' : '1px solid transparent',
                                background: isHovered ? 'rgba(255,0,64,0.08)' : 'transparent',
                                opacity: isDeleting ? 0.5 : 1,
                              }}
                              title="Eliminar transacción"
                            >
                              {isDeleting ? '…' : '✕'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Receipt footer */}
          <div className="border-t border-dashed border-gray-800 px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600 tracking-widest uppercase">
                Total Gastado
              </span>
              <span
                className="text-sm font-bold"
                style={{ color: '#e0e0e0' }}
              >
                {formatEuro(totalGastado)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-700 tracking-widest uppercase">
                Transacciones
              </span>
              <span className="text-xs text-gray-700">{transactions.length}</span>
            </div>
            <div className="text-center text-xs text-gray-800 tracking-widest mt-3">
              ━━━━━━━━━━━━━━━━━━━━━━━━
            </div>
            <div className="text-center text-xs text-gray-800 tracking-widest mt-1">
              GRACIAS POR SU CONFIANZA
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-800 tracking-widest pb-4">
          💸 CASHBROS — Contabilidad entre hermanos
        </div>
      </div>
    </div>
  )
}
