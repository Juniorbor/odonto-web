import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { parseLocalDate } from "@/lib/utils"
import { z } from "zod"

const updateSchema = z.object({
  date: z.string().optional(),
  patientName: z.string().max(190).optional().or(z.literal("")),
  serviceName: z.string().min(2).max(190).optional(),
  categoryId: z.string().optional().or(z.literal("")),
  value: z.coerce.number().min(0).max(99999999).optional(),
  status: z.enum(["DONE", "PENDING", "CANCELLED"]).optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })
  if (!hasModule(ctx, "production")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const existing = await prisma.productionRecord.findFirst({ where: { id, tenantId: ctx.tenantId } })
  if (!existing) return NextResponse.json({ error: "Produção não encontrada." }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const data: Record<string, unknown> = {}
    if (d.date) data.date = parseLocalDate(d.date)!
    if (d.patientName !== undefined) data.patientName = d.patientName || null
    if (d.serviceName !== undefined) data.serviceName = d.serviceName
    if (d.categoryId !== undefined) data.categoryId = d.categoryId || null
    if (d.value !== undefined) data.value = d.value
    if (d.status !== undefined) data.status = d.status as never
    if (d.notes !== undefined) data.notes = d.notes || null

    await prisma.productionRecord.update({ where: { id }, data })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "production_updated",
      entityType: "ProductionRecord",
      entityId: id,
      details: { changed: Object.keys(data) },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Update production error:", e)
    return NextResponse.json({ error: "Erro ao atualizar produção." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })

  const { id } = await params
  const existing = await prisma.productionRecord.findFirst({ where: { id, tenantId: ctx.tenantId } })
  if (!existing) return NextResponse.json({ error: "Produção não encontrada." }, { status: 404 })

  try {
    await prisma.productionRecord.delete({ where: { id } })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "production_deleted",
      entityType: "ProductionRecord",
      entityId: id,
      details: { code: existing.code },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete production error:", e)
    return NextResponse.json({ error: "Erro ao excluir produção." }, { status: 500 })
  }
}