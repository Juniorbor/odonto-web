import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const updateSchema = z.object({
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  type: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  professionalId: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  patientId: z.string().optional(),
})

const typeMap: Record<string, string> = {
  SCHEDULED: "appointment_scheduled",
  CONFIRMED: "appointment_confirmed",
  IN_PROGRESS: "appointment_started",
  COMPLETED: "appointment_completed",
  CANCELLED: "appointment_cancelled",
  NO_SHOW: "appointment_no_show",
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const { id } = await params
  const existing = await prisma.appointment.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!existing) return NextResponse.json({ error: "Atendimento não encontrado." }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const data: Record<string, unknown> = {}
    if (d.startsAt) {
      const s = new Date(d.startsAt)
      if (isNaN(s.getTime())) return NextResponse.json({ error: "Data inválida." }, { status: 400 })
      data.startsAt = s
      if (!d.endsAt) data.endsAt = new Date(s.getTime() + 30 * 60 * 1000)
    }
    if (d.endsAt) data.endsAt = new Date(d.endsAt)
    if (d.professionalId !== undefined) {
      if (d.professionalId) {
        const professional = await prisma.professional.findFirst({
          where: { id: d.professionalId, clinicId: ctx.clinicId },
        })
        if (!professional) return NextResponse.json({ error: "Profissional não encontrado." }, { status: 404 })
      }
      data.professionalId = d.professionalId ?? null
    }
    if (d.type !== undefined) data.type = d.type
    if (d.notes !== undefined) data.notes = d.notes
    if (d.status) {
      data.status = d.status
      if (d.status === "COMPLETED" && !existing.endsAt) {
        data.endsAt = new Date()
      }
    }
    if (d.patientId) {
      const patient = await prisma.patient.findFirst({ where: { id: d.patientId, clinicId: ctx.clinicId } })
      if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })
      data.patientId = d.patientId
    }

    const appointment = await prisma.appointment.update({ where: { id }, data })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: d.status ? typeMap[d.status] ?? "appointment_updated" : "appointment_updated",
      entityType: "Appointment",
      entityId: id,
      details: { status: d.status, changed: Object.keys(data) },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Update appointment error:", e)
    return NextResponse.json({ error: "Erro ao atualizar atendimento." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const { id } = await params
  const hard = req.nextUrl.searchParams.get("hard") === "1"
  const existing = await prisma.appointment.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!existing) return NextResponse.json({ error: "Atendimento não encontrado." }, { status: 404 })

  try {
    if (hard) {
      await prisma.appointment.delete({ where: { id } })
      await logAction({
        userId: ctx.user.id,
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        action: "appointment_deleted_hard",
        entityType: "Appointment",
        entityId: id,
        details: { patientId: existing.patientId, startsAt: existing.startsAt },
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
    } else {
      await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } })
      await logAction({
        userId: ctx.user.id,
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        action: "appointment_deleted",
        entityType: "Appointment",
        entityId: id,
        details: { patientId: existing.patientId },
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete appointment error:", e)
    return NextResponse.json({ error: hard ? "Erro ao excluir atendimento." : "Erro ao cancelar atendimento." }, { status: 500 })
  }
}