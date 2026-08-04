import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const createSchema = z.object({
  patientId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().optional(),
  type: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
})

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const from = req.nextUrl.searchParams.get("from")
  const to = req.nextUrl.searchParams.get("to")
  const patientId = req.nextUrl.searchParams.get("patientId")

  const where: Record<string, unknown> = { clinicId: ctx.clinicId }
  if (from && to) where.startsAt = { gte: new Date(from), lt: new Date(to) }
  if (patientId) where.patientId = patientId

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      type: true,
      notes: true,
      patient: { select: { id: true, fullName: true, phone: true } },
      user: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({
    appointments: appointments.map((a) => ({
      ...a,
      startsAt: a.startsAt.toISOString(),
      endsAt: a.endsAt?.toISOString() ?? null,
    })),
  })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "agenda") && !hasModule(ctx, "appointments")) {
    return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const patient = await prisma.patient.findFirst({ where: { id: d.patientId, clinicId: ctx.clinicId } })
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

    const startsAt = new Date(d.startsAt)
    if (isNaN(startsAt.getTime())) return NextResponse.json({ error: "Data inválida." }, { status: 400 })
    const endsAt = d.endsAt ? new Date(d.endsAt) : new Date(startsAt.getTime() + 30 * 60 * 1000)

    const appointment = await prisma.appointment.create({
      data: {
        clinicId: ctx.clinicId,
        patientId: d.patientId,
        userId: ctx.user.id,
        startsAt,
        endsAt,
        type: d.type,
        notes: d.notes,
        status: d.status ?? "SCHEDULED",
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "appointment_created",
      entityType: "Appointment",
      entityId: appointment.id,
      details: { patientId: d.patientId, startsAt: startsAt.toISOString(), type: d.type },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, id: appointment.id })
  } catch (e) {
    console.error("Create appointment error:", e)
    return NextResponse.json({ error: "Erro ao criar atendimento." }, { status: 500 })
  }
}