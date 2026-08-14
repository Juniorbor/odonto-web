import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { storageStatus } from "@/lib/storage"

export const dynamic = "force-dynamic"

export async function GET() {
  const dbSet = !!process.env.DATABASE_URL
  const jwtSet = !!process.env.JWT_SECRET

  let dbConnect = "nao-testado (DATABASE_URL ausente)"
  if (dbSet) {
    try {
      const users = await prisma.user.count()
      dbConnect = `ok (${users} usuarios)`
    } catch (e) {
      dbConnect = `erro: ${(e as Error).message.slice(0, 300)}`
    }
  }

  return NextResponse.json({
    ok: true,
    dbSet,
    jwtSet,
    dbConnect,
    blob: storageStatus(),
    nodeEnv: process.env.NODE_ENV,
  })
}
