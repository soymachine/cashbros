import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = request.cookies.get('token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  if (transaction.payerId !== payload.userId) {
    return NextResponse.json(
      { error: 'You can only delete your own transactions' },
      { status: 403 }
    )
  }

  await prisma.transaction.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
