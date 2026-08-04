import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { Prisma } from "@prisma/client"
import { z } from "zod"

const patchSchema = z.object({
  title: z.string().min(2).max(190).optional(),
  content: z.string().max(50000).optional().or(z.literal("")),
  signedByName: z.string().max(190).optional().or(z.literal("")),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "documents")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const document = await prisma.document.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 })

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }
  const d = parsed.data

  const updated = await prisma.document.update({
    where: { id },
    data: {
      title: d.title ?? undefined,
      content: d.content !== undefined ? (d.content.trim() ? { text: d.content.trim() } : Prisma.JsonNull) : undefined,
      signedByName: d.signedByName !== undefined ? (d.signedByName.trim() ? d.signedByName.trim() : null) : undefined,
    },
  })

  await logAction({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    action: "document.update",
    entityType: "Document",
    entityId: id,
  })

  return NextResponse.json({ ok: true, id: updated.id })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "documents")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const document = await prisma.document.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!document) return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 })

  await prisma.document.delete({ where: { id } })

  await logAction({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    action: "document.delete",
    entityType: "Document",
    entityId: id,
  })

  return NextResponse.json({ ok: true })
}
