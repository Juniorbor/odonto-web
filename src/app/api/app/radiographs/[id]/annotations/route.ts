import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "radiographs")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const radiograph = await prisma.radiograph.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!radiograph) return NextResponse.json({ error: "Radiografia não encontrada." }, { status: 404 })

  const latest = await prisma.radiographAnnotation.findFirst({
    where: { radiographId: id },
    orderBy: { version: "desc" },
    select: { id: true, layerJson: true, version: true, createdAt: true, user: { select: { name: true } } },
  })

  return NextResponse.json({
    annotation: latest
      ? { ...latest, createdAt: latest.createdAt.toISOString(), layerJson: latest.layerJson as unknown }
      : null,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "radiographs")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const radiograph = await prisma.radiograph.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!radiograph) return NextResponse.json({ error: "Radiografia não encontrada." }, { status: 404 })

  const body = await req.json().catch(() => null)
  const layerJson = body?.layerJson
  if (Array.isArray(layerJson) === false) {
    return NextResponse.json({ error: "Camada de anotações inválida." }, { status: 400 })
  }
  if (!Array.isArray(layerJson) || layerJson.length > 2000) {
    return NextResponse.json({ error: "Muitos elementos na camada." }, { status: 400 })
  }

  const latest = await prisma.radiographAnnotation.findFirst({
    where: { radiographId: id },
    orderBy: { version: "desc" },
    select: { version: true },
  })

  const annotation = await prisma.radiographAnnotation.create({
    data: {
      radiographId: id,
      version: (latest?.version ?? 0) + 1,
      layerJson: layerJson as object[],
      userId: ctx.user.id,
    },
  })

  await logAction({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    action: "radiograph.annotate",
    entityType: "RadiographAnnotation",
    entityId: annotation.id,
    details: { radiographId: id, version: annotation.version, elements: layerJson.length },
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  })

  return NextResponse.json({ ok: true, version: annotation.version })
}