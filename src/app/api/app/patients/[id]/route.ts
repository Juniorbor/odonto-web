import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { removeFile } from "@/lib/storage"
import { z } from "zod"

const updateSchema = z.object({
  fullName: z.string().min(2).max(190).optional(),
  socialName: z.string().max(190).optional(),
  cpf: z.string().max(20).optional(),
  rg: z.string().max(30).optional(),
  birthDate: z.string().optional(),
  sex: z.string().max(20).optional(),
  maritalStatus: z.string().max(30).optional(),
  occupation: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  whatsapp: z.string().max(30).optional(),
  email: z.string().email().max(190).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(2).optional(),
  cep: z.string().max(9).optional(),
  guardian: z.string().max(190).optional(),
  observations: z.string().max(2000).optional(),
  active: z.boolean().optional(),
})

function clean(v: string | undefined | null) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const { id } = await params
  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: ctx.clinicId },
    include: {
      _count: { select: { appointments: true, clinicalRecords: true, documents: true, radiographs: true, odontograms: true } },
    },
  })
  if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

  const { birthDate, createdAt, updatedAt, ...rest } = patient
  return NextResponse.json({
    patient: { ...rest, birthDate: birthDate?.toISOString() ?? null, createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "patients")) return NextResponse.json({ error: "Módulo indisponível." }, { status: 403 })

  const { id } = await params
  const existing = await prisma.patient.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!existing) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(d)) {
      if (k === "birthDate") data.birthDate = v ? new Date(v as string) : null
      else data[k] = typeof v === "string" ? clean(v) : v
    }

    const patient = await prisma.patient.update({ where: { id }, data })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "patient_updated",
      entityType: "Patient",
      entityId: id,
      details: { name: patient.fullName },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Update patient error:", e)
    return NextResponse.json({ error: "Erro ao atualizar paciente." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "patients")) return NextResponse.json({ error: "Módulo indisponível." }, { status: 403 })

  const { id } = await params
  const existing = await prisma.patient.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!existing) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

  // hard delete (exclusão definitiva) | default: soft archive
  const hard = req.nextUrl.searchParams.get("hard") === "1"

  if (!hard) {
    try {
      await prisma.patient.update({ where: { id }, data: { active: false } })

      await logAction({
        userId: ctx.user.id,
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        action: "patient_archived",
        entityType: "Patient",
        entityId: id,
        details: { name: existing.fullName },
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })

      return NextResponse.json({ ok: true, archived: true })
    } catch (e) {
      console.error("Archive patient error:", e)
      return NextResponse.json({ error: "Erro ao arquivar paciente." }, { status: 500 })
    }
  }

  try {
    const [radiographs, patientImages] = await Promise.all([
      prisma.radiograph.findMany({
        where: { patientId: id, clinicId: ctx.clinicId },
        select: { originalPath: true, annotatedPath: true },
      }),
      prisma.patientImage.findMany({
        where: { patientId: id, clinicId: ctx.clinicId },
        select: { path: true },
      }),
    ])

    await prisma.patient.delete({ where: { id } })

    await Promise.all([
      radiographs.forEach((r) => {
        removeFile(r.originalPath)
        if (r.annotatedPath) removeFile(r.annotatedPath)
      }),
      patientImages.forEach((i) => removeFile(i.path)),
    ])

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "patient_deleted",
      entityType: "Patient",
      entityId: id,
      details: { name: existing.fullName },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, deleted: true })
  } catch (e) {
    console.error("Delete patient error:", e)
    return NextResponse.json({ error: "Erro ao excluir paciente." }, { status: 500 })
  }
}