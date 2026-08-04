import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { parseLocalDate } from "@/lib/utils"
import { z } from "zod"

const recordSchema = z.object({
  patientId: z.string().min(1),
  occurredAt: z.string().optional(),
  chiefComplaint: z.string().max(4000).optional().or(z.literal("")),
  hda: z.string().max(6000).optional().or(z.literal("")),
  examFindings: z.string().max(6000).optional().or(z.literal("")),
  diagnoses: z.string().max(4000).optional().or(z.literal("")),
  procedures: z.string().max(6000).optional().or(z.literal("")),
  prescriptions: z.string().max(4000).optional().or(z.literal("")),
  observations: z.string().max(4000).optional().or(z.literal("")),
  nextReturnAt: z.string().optional().or(z.literal("")),
})

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "appointments") && !hasModule(ctx, "patients")) {
    return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = recordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const patient = await prisma.patient.findFirst({ where: { id: d.patientId, clinicId: ctx.clinicId } })
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

    const record = await prisma.clinicalRecord.create({
      data: {
        clinicId: ctx.clinicId,
        patientId: d.patientId,
        userId: ctx.user.id,
        occurredAt: parseLocalDate(d.occurredAt) ?? new Date(),
        chiefComplaint: d.chiefComplaint || undefined,
        hda: d.hda || undefined,
        examFindings: d.examFindings || undefined,
        diagnoses: d.diagnoses || undefined,
        procedures: d.procedures || undefined,
        prescriptions: d.prescriptions || undefined,
        observations: d.observations || undefined,
        nextReturnAt: d.nextReturnAt ? new Date(d.nextReturnAt) : undefined,
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "clinical_record_created",
      entityType: "ClinicalRecord",
      entityId: record.id,
      details: { patientId: d.patientId },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, id: record.id })
  } catch (e) {
    console.error("Create record error:", e)
    return NextResponse.json({ error: "Erro ao salvar evolução." }, { status: 500 })
  }
}