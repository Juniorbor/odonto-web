import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

function createClient() {
  // Conexão direta (sem pooler) tem menor latência por query. Falls back para DATABASE_URL.
  const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL!
  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma