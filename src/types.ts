export interface UserProfile {
  uid: string
  name: string
  username: string
  color: 'cyan' | 'orange'
  emoji: string
}

export interface Transaction {
  id: string
  amount: number
  description: string
  category: string
  type: 'expense' | 'settlement'
  payerId: string
  payerName: string
  createdAt: Date
}

export interface BalanceResult {
  user1: UserProfile  // bro1
  user2: UserProfile  // bro2
  netBalance: number  // positive = user1 owed by user2
  owingUser: UserProfile | null
  owedUser: UserProfile | null
  amount: number
  isEven: boolean
  totalPaidByUser1: number
  totalPaidByUser2: number
}
