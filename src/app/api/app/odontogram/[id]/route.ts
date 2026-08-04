import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

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