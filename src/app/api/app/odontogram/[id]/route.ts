import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const patchSchema = z.object({
  condition: z.enum(["CARIE", "OBTURADO", "COROA", "EXTRAIDO", "FRATURADO", "RAIZ", "IMPLANTE", "SAUDAVEL"]).optional(),
  surface: z.string().max(5).optional(),
  shape: z.enum(["NONE", "X", "DOT"]).optional(),
  color: z.string().max(20).optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const condition = await prisma.toothCondition.findFirst({
      where: { id, odontogram: { patient: { clinicId: ctx.clinicId } } },
    })
    if (!condition) return NextResponse.json({ error: "Condição não encontrada." }, { status: 404 })

    const updated = await prisma.toothCondition.update({
      where: { id },
      data: {
        ...(d.condition ? { condition: d.condition } : {}),
        ...(d.surface !== undefined ? { surface: d.surface } : {}),
        ...(d.shape !== undefined ? { shape: d.shape } : {}),
        ...(d.color !== undefined ? { color: d.color || null } : {}),
        ...(d.note !== undefined ? { note: d.note || null } : {}),
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "odontogram_condition_updated",
      entityType: "ToothCondition",
      entityId: id,
      details: { tooth: updated.toothNumber, condition: updated.condition, shape: updated.shape },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, condition: updated })
  } catch (e) {
    console.error("Patch condition error:", e)
    return NextResponse.json({ error: "Erro ao atualizar condição." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const { id } = await params
  try {
    const condition = await prisma.toothCondition.findFirst({
      where: { id, odontogram: { patient: { clinicId: ctx.clinicId } } },
    })
    if (!condition) return NextResponse.json({ error: "Condição não encontrada." }, { status: 404 })

    await prisma.toothCondition.update({ where: { id }, data: { removedAt: new Date() } })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "odontogram_condition_removed",
      entityType: "ToothCondition",
      entityId: id,
      details: { tooth: condition.toothNumber },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete condition error:", e)
    return NextResponse.json({ error: "Erro ao remover condição." }, { status: 500 })
  }
}