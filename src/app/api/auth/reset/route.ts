import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, hashResetToken, createSessionToken, setSessionCookie, requestIsSecure } from "@/lib/auth"
import { logAction } from "@/lib/audit"
import { z } from "zod"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = z
      .object({
        token: z.string().min(20),
        password: z.string().min(6).max(200),
      })
      .safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

    const tokenHash = hashResetToken(parsed.data.token)
    const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 })
    }

    const passwordHash = await hashPassword(parsed.data.password)
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    ])

    const user = await prisma.user.findUnique({ where: { id: reset.userId } })
    const token = await createSessionToken(reset.userId)
    await setSessionCookie(token, { secure: requestIsSecure(req) })
    await prisma.user.update({ where: { id: reset.userId }, data: { lastLoginAt: new Date() } })

    await logAction({
      userId: reset.userId,
      action: "password_reset",
      entityType: "User",
      entityId: reset.userId,
    })

    return NextResponse.json({ ok: true, user: { id: user?.id, name: user?.name, role: user?.role, email: user?.email } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao redefinir senha." }, { status: 500 })
  }
}