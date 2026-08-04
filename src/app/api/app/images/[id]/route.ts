import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { removeFile } from "@/lib/storage"
import { parseLocalDate } from "@/lib/utils"
import { ImageCategory } from "@prisma/client"
import { z } from "zod"

const patchSchema = z.object({
  category: z.nativeEnum(ImageCategory).optional(),
  label: z.string().max(190).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
  takenAt: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "images")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const image = await prisma.patientImage.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!image) return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }
  const d = parsed.data

  const updated = await prisma.patientImage.update({
    where: { id },
    data: {
      ...(d.category ? { category: d.category } : {}),
      label: d.label?.trim() ? d.label.trim() : undefined,
      notes: d.notes?.trim() ? d.notes.trim() : undefined,
      ...(d.takenAt ? { takenAt: parseLocalDate(d.takenAt)! } : {}),
    },
  })

  await logAction({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    action: "image.update",
    entityType: "PatientImage",
    entityId: id,
  })

  return NextResponse.json({ ok: true, id: updated.id })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "images")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const image = await prisma.patientImage.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!image) return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 })

  await prisma.patientImage.delete({ where: { id } })
  await removeFile(image.path)

  await logAction({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    action: "image.delete",
    entityType: "PatientImage",
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}