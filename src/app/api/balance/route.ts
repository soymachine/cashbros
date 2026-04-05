import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { computeBalance, UserBalance } from '@/lib/balance'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const users = await prisma.user.findMany({
    orderBy: { username: 'asc' },
  })

  if (users.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 users' }, { status: 400 })
  }

  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      amount: true,
      type: true,
      payerId: true,
    },
  })

  const user1: UserBalance = {
    userId: users[0].id,
    name: users[0].name,
    username: users[0].username,
    color: users[0].color,
    emoji: users[0].emoji,
    totalPaid: 0,
  }

  const user2: UserBalance = {
    userId: users[1].id,
    name: users[1].name,
    username: users[1].username,
    color: users[1].color,
    emoji: users[1].emoji,
    totalPaid: 0,
  }

  const result = computeBalance(user1, user2, transactions)

  return NextResponse.json(result)
}
