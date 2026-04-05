import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const user1Password = process.env.USER1_PASSWORD || 'bro1'
  const user2Password = process.env.USER2_PASSWORD || 'bro2'
  const user1Name = process.env.USER1_NAME || 'Hermano 1'
  const user2Name = process.env.USER2_NAME || 'Hermano 2'

  const hash1 = await bcrypt.hash(user1Password, 10)
  const hash2 = await bcrypt.hash(user2Password, 10)

  const user1 = await prisma.user.upsert({
    where: { username: 'bro1' },
    update: { passwordHash: hash1, name: user1Name },
    create: {
      username: 'bro1',
      name: user1Name,
      passwordHash: hash1,
      color: 'cyan',
      emoji: '💻',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { username: 'bro2' },
    update: { passwordHash: hash2, name: user2Name },
    create: {
      username: 'bro2',
      name: user2Name,
      passwordHash: hash2,
      color: 'orange',
      emoji: '🎨',
    },
  })

  console.log('Seeded users:', user1.username, user2.username)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
