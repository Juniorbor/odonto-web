import { NextRequest, NextResponse } from "next/server"
import { verifyPassword, createSessionToken, setSessionCookie, setImpersonationCookie, requestIsSecure } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const schema = z.object({
  email: z.string().email().max(190),
  password: z.string().min(1).max(200),
  remember: z.boolean().optional(),
})

const SEVEN_DAYS = 60 * 60 * 24 * 7
const TWELVE_HOURS = 60 * 60 * 12

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
    }

    const { email, password, remember } = parsed.data
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 })
    }
    if (!user.active) {
      return NextResponse.json({ error: "Conta desativada. Contate o administrador." }, { status: 403 })
    }

    if (user.role !== "ADMIN_MASTER" && user.clinicId) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: user.clinicId },
        select: { tenant: { select: { status: true } } },
      })
      if (clinic && !["ACTIVE", "TRIAL"].includes(clinic.tenant.status)) {
        return NextResponse.json(
          { error: "Assinatura suspensa ou expirada. Contate o suporte." },
          { status: 403 },
        )
      }
    }

    const token = await createSessionToken(user.id)
    const secure = requestIsSecure(req)
    await setSessionCookie(token, {
      secure,
      maxAge: remember === false ? TWELVE_HOURS : SEVEN_DAYS,
    })

    if (user.role === "ADMIN_MASTER") {
      const clinicCount = await prisma.clinic.count()
      if (clinicCount === 1) {
        const clinic = await prisma.clinic.findFirst({
          select: { id: true, tenant: { select: { status: true } } },
        })
        if (clinic && ["ACTIVE", "TRIAL"].includes(clinic.tenant.status)) {
          await setImpersonationCookie(clinic.id, { secure })
        }
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await logAction({
      userId: user.id,
      action: "login",
      entityType: "User",
      entityId: user.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: req.headers.get("user-agent"),
    })

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      isAdminMaster: user.role === "ADMIN_MASTER",
    })
  } catch (e) {
    console.error("Login error:", e)
    return NextResponse.json({ error: "Erro interno ao efetuar login." }, { status: 500 })
  }
}