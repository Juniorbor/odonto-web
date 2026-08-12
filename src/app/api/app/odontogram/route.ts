import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const conditionSchema = z.object({
  patientId: z.string().min(1),
  toothNumber: z.coerce.number().int().min(1).max(48),
  surface: z.string().max(5).default("WHOLE"),
  condition: z.enum(["CARIE", "OBTURADO", "COROA", "EXTRAIDO", "FRATURADO", "RAIZ", "IMPLANTE", "SAUDAVEL"]),
  shape: z.enum(["NONE", "X", "DOT"]).default("NONE"),
  size: z.enum(["S", "M", "L"]).default("M"),
  color: z.string().max(20).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
})

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const patientId = req.nextUrl.searchParams.get("patientId")
  if (!patientId) return NextResponse.json({ error: "patientId obrigatório." }, { status: 400 })

  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId: ctx.clinicId } })
  if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

  const odontogram = await prisma.odontogram.findFirst({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: { conditions: { where: { removedAt: null } } },
  })

  return NextResponse.json({
    odontogram: odontogram
      ? {
          id: odontogram.id,
          name: odontogram.name,
          conditions: odontogram.conditions.map((c) => ({
            id: c.id,
            toothNumber: c.toothNumber,
            surface: c.surface,
            condition: c.condition,
            shape: c.shape,
            size: c.size,
            color: c.color,
            note: c.note,
            createdAt: c.createdAt.toISOString(),
          })),
        }
      : null,
  })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "odontogram")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = conditionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const patient = await prisma.patient.findFirst({ where: { id: d.patientId, clinicId: ctx.clinicId } })
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

    let odontogram = await prisma.odontogram.findFirst({
      where: { patientId: d.patientId },
      orderBy: { createdAt: "desc" },
    })
    if (!odontogram) {
      odontogram = await prisma.odontogram.create({
        data: {
          patientId: d.patientId,
          clinicId: ctx.clinicId,
          name: "Odontograma",
        },
      })
    }

    const condition = await prisma.toothCondition.create({
      data: {
        odontogramId: odontogram.id,
        toothNumber: d.toothNumber,
        surface: d.surface,
        condition: d.condition,
        shape: d.shape,
        size: d.size,
        color: d.color || undefined,
        note: d.note || undefined,
        userId: ctx.user.id,
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "odontogram_condition_added",
      entityType: "ToothCondition",
      entityId: condition.id,
      details: { tooth: d.toothNumber, condition: d.condition },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, id: condition.id, odontogramId: odontogram.id })
  } catch (e) {
    console.error("Create condition error:", e)
    return NextResponse.json({ error: "Erro ao registrar condição." }, { status: 500 })
  }
}