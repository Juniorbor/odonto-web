import { NextRequest, NextResponse } from "next/server"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(190),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  planId: z.string().optional(),
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "EXPIRED", "CANCELLED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  clinicName: z.string().min(2).max(190).optional(),
  responsibleName: z.string().max(190).optional(),
  cro: z.string().max(60).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(2).optional(),
})

export async function POST(req: NextRequest) {
  const admin = await requireAdminMaster()
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "Já existe um usuário com este e-mail." }, { status: 409 })
    }

    const plan = d.planId
      ? await prisma.plan.findFirst({ where: { id: d.planId, active: true } })
      : await prisma.plan.findFirst({ where: { isGlobal: true, name: "Profissional" } })
    if (d.planId && !plan) {
      return NextResponse.json({ error: "Plano não encontrado." }, { status: 400 })
    }

    const passwordHash = await hashPassword(d.password)

    const tenant = await prisma.tenant.create({
      data: {
        name: d.name,
        status: d.status ?? "TRIAL",
        planName: plan?.name,
        clinics: {
          create: {
            name: d.clinicName ?? d.name,
            responsible: d.responsibleName,
            cro: d.cro,
            phone: d.phone,
            whatsapp: d.whatsapp,
            city: d.city,
            state: d.state,
          },
        },
        subscriptions: {
          create: {
            planId: plan?.id,
            startDate: d.startDate ? new Date(d.startDate) : new Date(),
            endDate: d.endDate ? new Date(d.endDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
            status: (d.status ?? "TRIAL") as never,
            userLimit: plan?.userLimit ?? 1,
            storageLimitBytes: plan?.storageLimitBytes ?? BigInt(1073741824),
            modules: plan?.modules ?? [],
          },
        },
        productionCategories: {
          createMany: {
            data: [
              { name: "Tomografia / Tomos", type: "TOMO" },
              { name: "Traçados", type: "TRACADO" },
              { name: "Outros serviços", type: "OUTRO" },
              { name: "Ariquemes", type: "FERNANDO" },
              { name: "Porto Velho", type: "FERNANDO" },
              { name: "Machadinho", type: "FERNANDO" },
              { name: "Cacoal", type: "FERNANDO" },
              { name: "Rolim de Moura", type: "BERNARDO" },
              { name: "Jí-Paraná", type: "BERNARDO" },
              { name: "Ouro Preto", type: "BERNARDO" },
            ],
          },
        },
        financialCategories: {
          createMany: {
            data: [
              { name: "Salário", type: "ENTRADA" },
              { name: "Primeira quinzena", type: "ENTRADA" },
              { name: "Prestação de serviço", type: "ENTRADA" },
              { name: "Outros", type: "ENTRADA" },
              { name: "Aluguel", type: "FIXA" },
              { name: "Água", type: "FIXA" },
              { name: "Energia", type: "FIXA" },
              { name: "Faculdade", type: "FIXA" },
              { name: "Internet", type: "FIXA" },
              { name: "Transporte", type: "FIXA" },
              { name: "Contador", type: "FIXA" },
              { name: "Família", type: "FIXA" },
              { name: "Mercado", type: "VARIAVEL" },
              { name: "Lazer", type: "VARIAVEL" },
              { name: "Saúde", type: "VARIAVEL" },
              { name: "Outros", type: "VARIAVEL" },
            ],
          },
        },
      },
    })

    const clinic = await prisma.clinic.findUnique({ where: { tenantId: tenant.id } })

    await prisma.user.create({
      data: {
        name: d.responsibleName || d.name,
        email: d.email.toLowerCase(),
        passwordHash,
        role: "CLINIC_ADMIN",
        clinicId: clinic?.id,
      },
    })

    await logAction({
      userId: admin.user.id,
      tenantId: tenant.id,
      action: "tenant_created",
      entityType: "Tenant",
      entityId: tenant.id,
      details: { name: tenant.name, plan: plan?.name } as never,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, id: tenant.id })
  } catch (e) {
    console.error("Create tenant error:", e)
    return NextResponse.json({ error: "Erro ao criar cliente." }, { status: 500 })
  }
}