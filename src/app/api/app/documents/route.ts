import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"
import { DocumentType } from "@prisma/client"

const createSchema = z.object({
  patientId: z.string().optional().or(z.literal("")),
  type: z.enum(["TERMO", "CONSENTIMENTO", "ANAMNESE", "RELATORIO", "ORIENTACOES", "PERSONALIZADO"]).default("PERSONALIZADO"),
  title: z.string().min(2).max(190),
  content: z.string().max(50000).optional().or(z.literal("")),
  signedByName: z.string().max(190).optional().or(z.literal("")),
})

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  TERMO: "Termo",
  CONSENTIMENTO: "Consentimento",
  ANAMNESE: "Anamnese",
  RELATORIO: "Relatório",
  ORIENTACOES: "Orientações",
  PERSONALIZADO: "Personalizado",
}

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "documents")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const patientId = req.nextUrl.searchParams.get("patientId") || undefined

  const documents = await prisma.document.findMany({
    where: { clinicId: ctx.clinicId, ...(patientId ? { patientId } : {}) },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      patientId: true,
      patient: { select: { id: true, fullName: true } },
      type: true,
      title: true,
      content: true,
      signedByName: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({
    documents: documents.map((d) => ({
      ...d,
      typeLabel: DOC_TYPE_LABELS[d.type as DocumentType] ?? d.type,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      content: typeof d.content === "object" && d.content !== null ? (d.content as { text?: string }).text ?? "" : "",
    })),
  })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "documents")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  if (d.patientId && d.patientId !== "") {
    const patient = await prisma.patient.findFirst({ where: { id: d.patientId, clinicId: ctx.clinicId } })
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })
  }

  const document = await prisma.document.create({
    data: {
      clinicId: ctx.clinicId,
      patientId: d.patientId || undefined,
      type: d.type as DocumentType,
      title: d.title,
      content: d.content ? { text: d.content } : undefined,
      signedByName: d.signedByName?.trim() ? d.signedByName.trim() : undefined,
    },
  })

  await logAction({
    userId: ctx.user.id,
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    action: "document.create",
    entityType: "Document",
    entityId: document.id,
    details: { title: d.title, type: d.type },
  })

  return NextResponse.json({ ok: true, id: document.id })
}
