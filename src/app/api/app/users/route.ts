import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { logAction, getClientIp } from "@/lib/audit"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2).max(190),
  email: z.string().email().max(190),
  password: z.string().min(6).max(200),
  role: z.enum(["CLINIC_ADMIN", "PROFESSIONAL", "RECEPTION"]).default("PROFESSIONAL"),
  title: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
})

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const users = await prisma.user.findMany({
    where: { clinicId: ctx.clinicId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      title: true,
      phone: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: ctx.tenantId!, status: { in: ["ACTIVE", "TRIAL"] } },
    orderBy: { createdAt: "desc" },
    select: { userLimit: true },
  })

  return NextResponse.json({ users, userLimit: subscription?.userLimit ?? 1 })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (ctx.user.role !== "CLINIC_ADMIN") {
    return NextResponse.json({ error: "Apenas administradores podem criar usuários." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const ip = await getClientIp(req.headers)
    const [subscription, count] = await Promise.all([
      prisma.subscription.findFirst({
        where: { tenantId: ctx.tenantId!, status: { in: ["ACTIVE", "TRIAL"] } },
        orderBy: { createdAt: "desc" },
        select: { userLimit: true },
      }),
      prisma.user.count({ where: { clinicId: ctx.clinicId, active: true } }),
    ])
    const limit = subscription?.userLimit ?? 1
    if (count >= limit) {
      return NextResponse.json(
        { error: `Limite de ${limit} usuário(s) ativo(s) atingido no seu plano.` },
        { status: 409 },
      )
    }

    const email = d.email.toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 })

    const user = await prisma.user.create({
      data: {
        name: d.name,
        email,
        passwordHash: await hashPassword(d.password),
        role: d.role,
        title: d.title,
        phone: d.phone,
        clinicId: ctx.clinicId,
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "user_created",
      entityType: "User",
      entityId: user.id,
      details: { name: user.name, email: user.email, role: user.role } as never,
      ip,
    })

    return NextResponse.json({ ok: true, id: user.id })
  } catch (e) {
    console.error("Create user error:", e)
    return NextResponse.json({ error: "Erro ao criar usuário." }, { status: 500 })
  }
}
