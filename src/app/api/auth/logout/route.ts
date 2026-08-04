import { NextRequest, NextResponse } from "next/server"
import { destroySessionCookie, getSessionToken, getSessionContext } from "@/lib/auth"
import { logAction } from "@/lib/audit"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext()
  if (ctx) {
    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "logout",
      entityType: "User",
      entityId: ctx.user.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })
    try {
      const token = await getSessionToken()
      if (token) await prisma.session.deleteMany({ where: { token } })
    } catch {
      // sessão local sem registro em tabela
    }
  }
  await destroySessionCookie()
  return NextResponse.json({ ok: true })
}