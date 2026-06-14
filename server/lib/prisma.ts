import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma client instance with Neon serverless PostgreSQL connection pooling.
 *
 * Connection pool configuration is managed via the `DATABASE_URL` connection string:
 * - `?connection_limit=5` — Maximum simultaneous connections from the pool.
 * - `&pool_timeout=10`  — Seconds to wait for a connection before timing out.
 *
 * Example DATABASE_URL:
 *   postgresql://user:pass@ep-example-123456.us-east-2.aws.neon.tech/neondb?connection_limit=5&pool_timeout=10
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})

// Warn if connection_limit is not explicitly set in the database URL — helps avoid
// accidental connection exhaustion in serverless environments like Neon.
if (process.env.NODE_ENV === 'development') {
  const url = process.env.DATABASE_URL ?? ''
  if (!url.includes('connection_limit')) {
    console.warn(
      '[prisma] DATABASE_URL does not include `connection_limit`. ' +
        'Add `?connection_limit=5&pool_timeout=10` to your connection string ' +
        'for safe connection pooling in serverless environments.',
    )
  } else {
    console.log('[prisma] Connection pool configured via DATABASE_URL')
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma