import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { parseLocalDate } from "@/lib/utils"
import { z } from "zod"

const createSchema = z.object({
  date: z.string().optional(),
  patientId: z.string().optional(),
  patientName: z.string().max(190).optional().or(z.literal("")),
  serviceName: z.string().min(2).max(190),
  serviceType: z.enum(["TOMO", "TRACADO", "OUTRO", "FERNANDO", "BERNARDO"]).default("OUTRO"),
  categoryId: z.string().optional(),
  value: z.coerce.number().min(0).max(99999999),
  status: z.enum(["DONE", "PENDING", "CANCELLED"]).default("DONE"),
  region: z.string().max(60).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
})

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })

  const month = req.nextUrl.searchParams.get("month")
  const [year, m] = month ? month.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
  const from = new Date(year, m - 1, 1)
  const to = new Date(year, m, 1)

  const [records, categories, total] = await Promise.all([
    prisma.productionRecord.findMany({
      where: { tenantId: ctx.tenantId, date: { gte: from, lt: to } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        code: true,
        date: true,
        patientName: true,
        patientId: true,
        serviceName: true,
        serviceType: true,
        value: true,
        status: true,
        notes: true,
        category: { select: { id: true, name: true } },
      },
    }),
    prisma.productionCategory.findMany({
      where: { tenantId: ctx.tenantId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.productionRecord.aggregate({
      where: { tenantId: ctx.tenantId, date: { gte: from, lt: to } },
      _sum: { value: true },
      _count: true,
    }),
  ])

  return NextResponse.json({
    records: records.map((r) => ({ ...r, date: r.date.toISOString(), value: r.value.toString() })),
    categories: categories.map((c) => ({ ...c, price: c.price?.toString() ?? null })),
    totals: { value: total._sum.value?.toString() ?? "0", count: total._count },
  })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })
  if (!hasModule(ctx, "production")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    if (d.patientId && d.patientId !== "") {
      const patient = await prisma.patient.findFirst({ where: { id: d.patientId, clinicId: ctx.clinicId ?? "none" } })
      if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })
    }

    const count = await prisma.productionRecord.count({ where: { tenantId: ctx.tenantId } })
    const code = `PR-${String(count + 1).padStart(5, "0")}`

    const record = await prisma.productionRecord.create({
      data: {
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        code,
        date: parseLocalDate(d.date) ?? new Date(),
        patientId: d.patientId || undefined,
        patientName: d.patientName || undefined,
        userId: ctx.user.id,
        categoryId: d.categoryId || undefined,
        serviceName: d.serviceName,
        serviceType: d.serviceType as never,
        region: d.region || undefined,
        city: d.city || undefined,
        value: d.value,
        status: d.status as never,
        notes: d.notes || undefined,
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "production_created",
      entityType: "ProductionRecord",
      entityId: record.id,
      details: { code, serviceName: d.serviceName, value: d.value },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, id: record.id, code })
  } catch (e) {
    console.error("Create production error:", e)
    return NextResponse.json({ error: "Erro ao registrar produção." }, { status: 500 })
  }
}