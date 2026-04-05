import type { Transaction, UserProfile, BalanceResult } from '../types'

export function computeBalance(
  transactions: Transaction[],
  user1: UserProfile,  // bro1
  user2: UserProfile,  // bro2
): BalanceResult {
  let netBalance = 0
  let totalPaidByUser1 = 0
  let totalPaidByUser2 = 0

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      if (tx.payerId === user1.uid) {
        // user1 paid → user2 owes half → net increases
        netBalance += tx.amount / 2
        totalPaidByUser1 += tx.amount
      } else if (tx.payerId === user2.uid) {
        // user2 paid → user1 owes half → net decreases
        netBalance -= tx.amount / 2
        totalPaidByUser2 += tx.amount
      }
    } else if (tx.type === 'settlement') {
      if (tx.payerId === user1.uid) {
        // user1 pays user2 → user1 reduces what user2 owes → net decreases
        netBalance -= tx.amount
      } else if (tx.payerId === user2.uid) {
        // user2 pays user1 → user2 reduces what user1 owes → net increases
        netBalance += tx.amount
      }
    }
  }

  const absAmount = Math.abs(netBalance)
  const isEven = absAmount < 0.01

  let owingUser: UserProfile | null = null
  let owedUser: UserProfile | null = null

  if (!isEven) {
    if (netBalance > 0) {
      // user2 owes user1
      owingUser = user2
      owedUser = user1
    } else {
      // user1 owes user2
      owingUser = user1
      owedUser = user2
    }
  }

  return {
    user1,
    user2,
    netBalance,
    owingUser,
    owedUser,
    amount: absAmount,
    isEven,
    totalPaidByUser1,
    totalPaidByUser2,
  }
}
