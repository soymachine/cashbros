export type UserBalance = {
  userId: string
  name: string
  username: string
  color: string
  emoji: string
  totalPaid: number
}

export type BalanceResult = {
  user1: UserBalance
  user2: UserBalance
  netBalance: number // positive = user1 is owed by user2
  owingUser: UserBalance | null // who owes
  owedUser: UserBalance | null // who is owed
  amount: number // absolute amount owed
  isEven: boolean
}

export type TransactionForBalance = {
  id: string
  amount: number
  type: string
  payerId: string
}

export function computeBalance(
  user1: UserBalance,
  user2: UserBalance,
  transactions: TransactionForBalance[]
): BalanceResult {
  let netBalance = 0
  let user1TotalPaid = 0
  let user2TotalPaid = 0

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      if (tx.payerId === user1.userId) {
        netBalance += tx.amount / 2
        user1TotalPaid += tx.amount
      } else if (tx.payerId === user2.userId) {
        netBalance -= tx.amount / 2
        user2TotalPaid += tx.amount
      }
    } else if (tx.type === 'settlement') {
      if (tx.payerId === user1.userId) {
        // user1 pays user2
        netBalance -= tx.amount
        user1TotalPaid += tx.amount
      } else if (tx.payerId === user2.userId) {
        // user2 pays user1
        netBalance += tx.amount
        user2TotalPaid += tx.amount
      }
    }
  }

  const u1 = { ...user1, totalPaid: user1TotalPaid }
  const u2 = { ...user2, totalPaid: user2TotalPaid }

  const amount = Math.abs(netBalance)
  const isEven = amount < 0.01

  let owingUser: UserBalance | null = null
  let owedUser: UserBalance | null = null

  if (!isEven) {
    if (netBalance > 0) {
      // user1 is owed by user2 → user2 owes
      owingUser = u2
      owedUser = u1
    } else {
      // user2 is owed by user1 → user1 owes
      owingUser = u1
      owedUser = u2
    }
  }

  return {
    user1: u1,
    user2: u2,
    netBalance,
    owingUser,
    owedUser,
    amount,
    isEven,
  }
}
