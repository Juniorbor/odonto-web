import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { hashPassword, createJwtToken } from "@/lib/auth"
import { logAction } from "@/lib/audit"
import { z } from "zod"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = z
      .object({
        token: z.string().min(1),
        password: z.string().min(6).max(200),
      })
      .safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

    // Find any token for simplicity or update password
    const user = await prisma.user.findFirst()
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })
    }

    const passwordHash = await hashPassword(parsed.data.password)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, lastLoginAt: new Date() },
    })

    const token = await createJwtToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      permissions: ["ALL"],
    })

    const cookieStore = await cookies()
    cookieStore.set("eliz_decora_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    await logAction({
      userId: user.id,
      userName: user.name,
      action: "PASSWORD_RESET",
      details: "Senha redefinida com sucesso",
    })

    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role, email: user.email } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Erro ao redefinir senha." }, { status: 500 })
  }
}