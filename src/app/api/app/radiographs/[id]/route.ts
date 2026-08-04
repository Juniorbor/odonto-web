import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { removeFile } from "@/lib/storage"
import { z } from "zod"

const patchSchema = z.object({
  label: z.string().max(190).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  reportObservations: z.string().max(4000).optional().or(z.literal("")),
  reportConclusion: z.string().max(2000).optional().or(z.literal("")),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "radiographs")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const radiograph = await prisma.radiograph.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!radiograph) return NextResponse.json({ error: "Radiografia não encontrada." }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }
  const d = parsed.data

  const updated = await prisma.radiograph.update({
    where: { id },
    data: {
      label: d.label?.trim() ? d.label.trim() : undefined,
      notes: d.notes?.trim() ? d.notes.trim() : undefined,
      reportObservations: d.reportObservations?.trim() ? d.reportObservations.trim() : undefined,
      reportConclusion: d.reportConclusion?.trim() ? d.reportConclusion.trim() : undefined,
      reportSignedAt: new Date(),
    },
  })

  await logAction({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    action: "radiograph.update",
    entityType: "Radiograph",
    entityId: id,
  })

  return NextResponse.json({ ok: true, id: updated.id })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "radiographs")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const radiograph = await prisma.radiograph.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!radiograph) return NextResponse.json({ error: "Radiografia não encontrada." }, { status: 404 })

  await prisma.radiograph.delete({ where: { id } })
  await removeFile(radiograph.originalPath)
  await removeFile(radiograph.annotatedPath)

  await logAction({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    action: "radiograph.delete",
    entityType: "Radiograph",
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}