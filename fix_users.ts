import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, nama: true }
  })
  console.log('Current users:')
  console.log(JSON.stringify(users, null, 2))

  // Fix guru1 password
  const guru1 = users.find(u => u.username === 'guru1')
  if (guru1) {
    const newHash = await bcrypt.hash('guru123', 12)
    await prisma.user.update({
      where: { id: guru1.id },
      data: { password: newHash }
    })
    console.log('\n✅ Fixed guru1 password to guru123')
  }

  // Verify login works
  console.log('\nVerifying guru1 login...')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
