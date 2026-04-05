'use client'

import { useState, useEffect, useCallback } from 'react'

type User = {
  userId: string
  username: string
  name: string
  color: string
  emoji: string
}

type UserBalance = {
  userId: string
  name: string
  username: string
  color: string
  emoji: string
  totalPaid: number
}

type BalanceResult = {
  user1: UserBalance
  user2: UserBalance
  netBalance: number
  owingUser: UserBalance | null
  owedUser: UserBalance | null
  amount: number
  isEven: boolean
}

type Transaction = {
  id: string
  amount: number
  description: string
  category: string
  type: string
  payerId: string
  createdAt: string
  payer: {
    id: string
    name: string
    username: string
    color: string
    emoji: string
  }
}

const CATEGORIES = [
  { value: 'general', label: 'General', icon: '📦' },
  { value: 'software', label: 'Software', icon: '💾' },
  { value: 'infraestructura', label: 'Infra', icon: '🖥️' },
  { value: 'marketing', label: 'Marketing', icon: '📣' },
  { value: 'diseño', label: 'Diseño', icon: '✏️' },
  { value: 'reunión', label: 'Reunión', icon: '🤝' },
  { value: 'otro', label: 'Otro', icon: '🔧' },
]

const CATEGORY_COLORS: Record<string, string> = {
  general: '#888',
  software: '#00ffff',
  infraestructura: '#8b5cf6',
  marketing: '#f59e0b',
  diseño: '#ff6b00',
  reunión: '#10b981',
  otro: '#6b7280',
}

function formatCurrency(amount: number) {
  return amount.toFixed(2) + '€'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}

function padEnd(str: string, len: number) {
  if (str.length >= len) return str.substring(0, len)
  return str + ' '.repeat(len - str.length)
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [balance, setBalance] = useState<BalanceResult | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [type, setType] = useState<'expense' | 'settlement'>('expense')
  const [formError, setFormError] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const [meRes, balanceRes, txRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/balance'),
        fetch('/api/transactions'),
      ])

      if (meRes.ok) {
        const meData = await meRes.json()
        setCurrentUser(meData.user)
      }
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json()
        setBalance(balanceData)
      }
      if (txRes.ok) {
        const txData = await txRes.json()
        setTransactions(txData.transactions)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  async function handleAddTransaction(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Ingresa un importe válido')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          description: description.trim(),
          category,
          type,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Error al crear la transacción')
        setSubmitting(false)
        return
      }

      // Reset form
      setAmount('')
      setDescription('')
      setCategory('general')
      setType('expense')
      setShowForm(false)

      // Refresh data
      await fetchAll()
    } catch {
      setFormError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id)
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchAll()
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">💸</div>
          <div className="neon-cyan text-sm tracking-widest animate-pulse">CARGANDO...</div>
        </div>
      </div>
    )
  }

  const neonColor = currentUser?.color === 'cyan' ? '#00ffff' : '#ff6b00'
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-8">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4">
        {/* ── HEADER ── */}
        <header className="flex items-center justify-between py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <span
              className="text-xl font-bold tracking-widest neon-cyan"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              CASHBROS
            </span>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <span className="text-xs text-gray-500 hidden sm:block">
                {currentUser.emoji} {currentUser.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-red-400 border border-[#333] hover:border-red-900 px-3 py-1.5 rounded-sm transition-colors tracking-wider"
            >
              SALIR
            </button>
          </div>
        </header>

        {/* ── BALANCE SECTION ── */}
        {balance && (
          <section className="mt-6 text-center">
            {balance.isEven ? (
              <div className="py-6">
                <div className="text-4xl mb-3">⚖️</div>
                <div
                  className="text-2xl sm:text-3xl font-bold tracking-wider neon-green animate-neon-pulse"
                  style={{ fontFamily: "'Share Tech Mono', monospace" }}
                >
                  EQUILIBRIO PERFECTO
                </div>
                <div className="text-gray-500 text-xs mt-2 tracking-widest">
                  NADIE DEBE NADA
                </div>
              </div>
            ) : (
              <div className="py-4">
                <div className="text-3xl mb-2">
                  {balance.owingUser?.emoji}
                </div>
                <div className="text-sm text-gray-400 tracking-widest mb-2">
                  ⚡ DEBE PAGAR ⚡
                </div>
                <div
                  className="text-5xl sm:text-6xl font-bold my-3"
                  style={{
                    color: '#ff0044',
                    textShadow: '0 0 10px #ff0044, 0 0 20px #ff0044, 0 0 40px rgba(255,0,68,0.5)',
                    animation: 'neonPulse 1.5s ease-in-out infinite',
                    fontFamily: "'Share Tech Mono', monospace",
                  }}
                >
                  {formatCurrency(balance.amount)}
                </div>
                <div className="text-sm text-gray-300 tracking-wide">
                  <span
                    style={{
                      color: balance.owingUser?.color === 'cyan' ? '#00ffff' : '#ff6b00',
                    }}
                  >
                    {balance.owingUser?.emoji} {balance.owingUser?.name}
                  </span>
                  <span className="text-gray-500 mx-2">→ debe a →</span>
                  <span
                    style={{
                      color: balance.owedUser?.color === 'cyan' ? '#00ffff' : '#ff6b00',
                    }}
                  >
                    {balance.owedUser?.name} {balance.owedUser?.emoji}
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── PLAYER CARDS ── */}
        {balance && (
          <section className="mt-4 grid grid-cols-2 gap-3">
            {[balance.user1, balance.user2].map((user) => {
              const isCyan = user.color === 'cyan'
              const color = isCyan ? '#00ffff' : '#ff6b00'
              const isMe = currentUser?.userId === user.userId
              const isOwing = balance.owingUser?.userId === user.userId

              return (
                <div
                  key={user.userId}
                  className={`rounded-sm p-4 border transition-all ${
                    isMe ? (isCyan ? 'card-glow-cyan-active' : 'card-glow-orange-active') : ''
                  }`}
                  style={{
                    background: `rgba(${isCyan ? '0,255,255' : '255,107,0'}, 0.04)`,
                    borderColor: `rgba(${isCyan ? '0,255,255' : '255,107,0'}, ${isMe ? '0.6' : '0.25'})`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xl">{user.emoji}</div>
                      <div
                        className="text-xs font-bold tracking-wider mt-1"
                        style={{ color }}
                      >
                        {isCyan ? 'P1' : 'P2'} {isMe && '◀ TÚ'}
                      </div>
                      <div className="text-white text-sm mt-0.5 font-semibold">
                        {user.name}
                      </div>
                    </div>
                    {isOwing && !balance.isEven && (
                      <div
                        className="text-xs px-1.5 py-0.5 rounded-sm"
                        style={{
                          background: 'rgba(255,0,68,0.15)',
                          color: '#ff0044',
                          border: '1px solid rgba(255,0,68,0.3)',
                        }}
                      >
                        DEBE
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-dashed" style={{ borderColor: `rgba(${isCyan ? '0,255,255' : '255,107,0'}, 0.15)` }}>
                    <div className="text-xs text-gray-500 tracking-wider">GASTADO</div>
                    <div className="text-sm font-bold mt-0.5" style={{ color }}>
                      {formatCurrency(user.totalPaid)}
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* ── ADD TRANSACTION BUTTON ── */}
        <section className="mt-5">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-sm text-sm font-bold tracking-widest border transition-all"
              style={{
                borderColor: neonColor,
                color: neonColor,
                background: `rgba(${currentUser?.color === 'cyan' ? '0,255,255' : '255,107,0'}, 0.05)`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `rgba(${currentUser?.color === 'cyan' ? '0,255,255' : '255,107,0'}, 0.12)`
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 10px ${neonColor}40`
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = `rgba(${currentUser?.color === 'cyan' ? '0,255,255' : '255,107,0'}, 0.05)`
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
              }}
            >
              + REGISTRAR GASTO
            </button>
          ) : (
            <div
              className="rounded-sm border p-5"
              style={{
                background: '#0f0f0f',
                borderColor: `rgba(${currentUser?.color === 'cyan' ? '0,255,255' : '255,107,0'}, 0.3)`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-sm font-bold tracking-widest"
                  style={{ color: neonColor }}
                >
                  ─ NUEVA TRANSACCIÓN ─
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setFormError('')
                    setAmount('')
                    setDescription('')
                    setCategory('general')
                    setType('expense')
                  }}
                  className="text-gray-600 hover:text-gray-400 text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                {/* Type toggle */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-wider">
                    TIPO
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['expense', 'settlement'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className="py-2 px-3 text-xs tracking-wider border rounded-sm transition-all"
                        style={{
                          borderColor: type === t ? neonColor : '#333',
                          color: type === t ? neonColor : '#666',
                          background: type === t ? `rgba(${currentUser?.color === 'cyan' ? '0,255,255' : '255,107,0'}, 0.08)` : 'transparent',
                        }}
                      >
                        {t === 'expense' ? '💸 GASTO' : '⇄ LIQUIDACIÓN'}
                      </button>
                    ))}
                  </div>
                  {type === 'settlement' && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      Pago directo entre hermanos para nivelar la balanza
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-wider">
                    IMPORTE (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                    className="input-dark w-full px-4 py-2.5 rounded-sm text-sm"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2 tracking-wider">
                    DESCRIPCIÓN
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="¿En qué se gastó?"
                    required
                    className="input-dark w-full px-4 py-2.5 rounded-sm text-sm"
                    style={{ fontFamily: "'Share Tech Mono', monospace" }}
                  />
                </div>

                {/* Category */}
                {type === 'expense' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 tracking-wider">
                      CATEGORÍA
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-dark w-full px-4 py-2.5 rounded-sm text-sm"
                      style={{ fontFamily: "'Share Tech Mono', monospace" }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formError && (
                  <div className="border border-red-900 bg-red-950/20 px-3 py-2 rounded-sm">
                    <p className="text-red-400 text-xs">⚠ {formError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setFormError('')
                    }}
                    className="py-2.5 text-xs tracking-wider border border-[#333] text-gray-500 hover:border-[#555] rounded-sm transition-colors"
                  >
                    CANCELAR
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="py-2.5 text-xs font-bold tracking-wider rounded-sm transition-all disabled:opacity-50"
                    style={{
                      background: `rgba(${currentUser?.color === 'cyan' ? '0,255,255' : '255,107,0'}, 0.15)`,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: neonColor,
                      color: neonColor,
                    }}
                  >
                    {submitting ? 'GUARDANDO...' : '✓ GUARDAR'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* ── RECEIPT / TRANSACTION LIST ── */}
        <section className="mt-6">
          <div
            className="receipt-tape rounded-sm overflow-hidden"
            style={{ fontFamily: "'Share Tech Mono', 'Courier New', monospace" }}
          >
            {/* Receipt header */}
            <div className="text-center py-4 px-4 border-b border-dashed border-[#333]">
              <div className="text-[#00ffff] text-sm tracking-widest font-bold">
                ═══ CASHBROS ═══
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Fecha: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
              <div className="text-gray-600 text-xs">
                {transactions.length} transacciones registradas
              </div>
            </div>

            {/* Transactions list */}
            <div
              className="overflow-y-auto px-4 py-2"
              style={{ maxHeight: '420px' }}
            >
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-xs tracking-widest">
                  <div className="text-3xl mb-3">📋</div>
                  <div>SIN TRANSACCIONES</div>
                  <div className="mt-1 text-gray-700">Registra el primer gasto ↑</div>
                </div>
              ) : (
                <div className="space-y-0">
                  {transactions.map((tx, idx) => {
                    const isCyan = tx.payer.color === 'cyan'
                    const payerColor = isCyan ? '#00ffff' : '#ff6b00'
                    const isOwn = tx.payerId === currentUser?.userId
                    const isSettlement = tx.type === 'settlement'
                    const catColor = CATEGORY_COLORS[tx.category] || '#888'
                    const catInfo = CATEGORIES.find((c) => c.value === tx.category)

                    return (
                      <div key={tx.id}>
                        {idx > 0 && (
                          <div className="border-t border-dashed border-[#1f1f1f] my-1" />
                        )}
                        <div
                          className={`py-2 group ${isSettlement ? 'opacity-80' : ''}`}
                          style={
                            isSettlement
                              ? { background: 'rgba(16,185,129,0.03)' }
                              : undefined
                          }
                        >
                          {/* Transaction main line */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-gray-500 text-xs whitespace-nowrap">
                                  {formatDate(tx.createdAt)}
                                </span>
                                <span style={{ color: payerColor }} className="text-xs font-bold">
                                  {tx.payer.emoji}
                                </span>
                                {isSettlement ? (
                                  <span className="text-xs" style={{ color: '#10b981' }}>
                                    ⇄ LIQUIDACIÓN
                                  </span>
                                ) : (
                                  <span
                                    className="text-xs px-1 rounded-sm"
                                    style={{
                                      color: catColor,
                                      border: `1px solid ${catColor}40`,
                                      background: `${catColor}10`,
                                      fontSize: '0.6rem',
                                      letterSpacing: '0.05em',
                                    }}
                                  >
                                    {catInfo?.icon} {tx.category.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="text-white text-xs mt-0.5 truncate pr-2">
                                {tx.description}
                              </div>
                              <div
                                className="text-xs mt-0.5"
                                style={{ color: `${payerColor}88` }}
                              >
                                pagado por {tx.payer.name}
                              </div>
                            </div>
                            <div className="flex items-start gap-2 shrink-0">
                              <div className="text-right">
                                <div
                                  className="text-sm font-bold whitespace-nowrap"
                                  style={{
                                    color: isSettlement ? '#10b981' : '#fff',
                                  }}
                                >
                                  {isSettlement ? '⇄ ' : ''}
                                  {formatCurrency(tx.amount)}
                                </div>
                                {!isSettlement && (
                                  <div className="text-xs text-gray-600">
                                    {formatCurrency(tx.amount / 2)}/c
                                  </div>
                                )}
                              </div>
                              {isOwn && (
                                <button
                                  onClick={() => handleDelete(tx.id)}
                                  disabled={deleteId === tx.id}
                                  className="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-red-500 transition-all text-xs mt-0.5 disabled:opacity-50"
                                  title="Eliminar"
                                >
                                  {deleteId === tx.id ? '...' : '✕'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Receipt footer / totals */}
            <div className="border-t-2 border-double border-[#333] px-4 py-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>TRANSACCIONES TOTALES</span>
                <span>{transactions.length}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>GASTOS</span>
                <span>{transactions.filter((t) => t.type === 'expense').length}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>LIQUIDACIONES</span>
                <span>{transactions.filter((t) => t.type === 'settlement').length}</span>
              </div>
              <div className="border-t border-dashed border-[#333] mt-2 pt-2 flex justify-between">
                <span className="text-xs font-bold text-white tracking-wider">
                  TOTAL GASTADO:
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: '#00ffff' }}
                >
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
              <div className="text-center mt-3 text-gray-700 text-xs tracking-widest">
                ─ GRACIAS POR CONSTRUIR JUNTOS ─
              </div>
              <div className="text-center text-gray-800 text-xs mt-0.5">
                cashbros v0.1.0
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
