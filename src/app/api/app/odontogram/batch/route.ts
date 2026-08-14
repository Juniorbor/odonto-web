import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const conditionInput = z.object({
  id: z.string().max(60),
  toothNumber: z.number().int().min(1).max(48),
  surface: z.string().min(1).max(10).default("WHOLE"),
  condition: z.enum(["CARIE", "OBTURADO", "COROA", "EXTRAIDO", "FRATURADO", "RAIZ", "IMPLANTE", "SAUDAVEL"]),
  shape: z.enum(["NONE", "X", "DOT"]).default("NONE"),
  size: z.enum(["S", "M", "L"]).optional(),
  color: z.string().max(30).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
})

const batchSchema = z.object({
  patientId: z.string().min(1),
  adds: z.array(conditionInput).max(200),
  updates: z.array(conditionInput).max(200),
  removes: z.array(z.string().max(60)).max(200),
})

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "odontogram")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = batchSchema.safeParse(body)
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
        data: { patientId: d.patientId, clinicId: ctx.clinicId, name: "Odontograma" },
      })
    }

    const created: { tempId: string; id: string }[] = []

    await prisma.$transaction(async (tx) => {
      const existing = await tx.toothCondition.findMany({
        where: { odontogramId: odontogram.id },
        select: { id: true },
      })
      const existingIds = new Set(existing.map((c) => c.id))

      const adds = d.adds.filter((a) => !existingIds.has(a.id))
      const updates = d.updates.filter((u) => existingIds.has(u.id))
      const removes = d.removes.filter((id) => existingIds.has(id))

      for (const a of adds) {
        const row = await tx.toothCondition.create({
          data: {
            odontogramId: odontogram.id,
            toothNumber: a.toothNumber,
            surface: a.surface,
            condition: a.condition,
            shape: a.shape,
            size: a.size ?? "M",
            color: a.color ?? undefined,
            note: a.note ?? undefined,
            userId: ctx.user.id,
          },
        })
        created.push({ tempId: a.id, id: row.id })
      }

      for (const u of updates) {
        await tx.toothCondition.updateMany({
          where: { id: u.id, odontogramId: odontogram.id },
          data: {
            toothNumber: u.toothNumber,
            surface: u.surface,
            condition: u.condition,
            shape: u.shape,
            size: u.size ?? "M",
            color: u.color ?? null,
            note: u.note ?? null,
          },
        })
      }

      if (removes.length > 0) {
        await tx.toothCondition.updateMany({
          where: { id: { in: removes }, odontogramId: odontogram.id },
          data: { removedAt: new Date() },
        })
      }
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "odontogram_batch_saved",
      entityType: "Odontogram",
      entityId: odontogram.id,
      details: { adds: d.adds.length, updates: d.updates.length, removes: d.removes.length },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, created })
  } catch (e) {
    console.error("Batch odontogram error:", e)
    return NextResponse.json({ error: "Erro ao salvar odontograma." }, { status: 500 })
  }
}