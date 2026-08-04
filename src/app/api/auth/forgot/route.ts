import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateResetToken, hashResetToken } from "@/lib/auth"
import { logAction } from "@/lib/audit"
import { z } from "zod"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = z.object({ email: z.string().email() }).safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
  if (!user) {
    return NextResponse.json({ ok: true, message: "Se o e-mail existir, enviaremos as instruções." })
  }

  const rawToken = generateResetToken()
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(rawToken),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  })

  // Em produção, enviar por e-mail. Aqui retornamos um link de reset para fins operacionais.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  await logAction({
    userId: user.id,
    action: "password_reset_requested",
    entityType: "User",
    entityId: user.id,
  })

  return NextResponse.json({
    ok: true,
    message: "Se o e-mail existir, enviaremos as instruções.",
    devResetUrl: `${baseUrl}/resetar-senha?token=${rawToken}`,
  })
}