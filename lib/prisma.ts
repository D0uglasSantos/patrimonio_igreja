import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Na Vercel, POSTGRES_URL pode ser usado como DATABASE_URL
// A Vercel Postgres usa POSTGRES_URL, mas o Prisma espera DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL

if (!databaseUrl) {
  console.error('[Prisma] DATABASE_URL não está definida!')
  console.error('[Prisma] Variáveis disponíveis:', {
    DATABASE_URL: !!process.env.DATABASE_URL,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    PRISMA_DATABASE_URL: !!process.env.PRISMA_DATABASE_URL,
  })
  throw new Error('DATABASE_URL não está configurada')
}

// Log da URL do banco (sem senha) para debug
const dbUrlForLog = databaseUrl.replace(/:[^:@]+@/, ':****@')
console.log('[Prisma] Conectando ao banco:', dbUrlForLog.split('?')[0])

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Na Vercel, não usar global para evitar problemas de conexão
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

