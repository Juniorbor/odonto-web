import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import {
  saveFile,
  removeFile,
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
  fileExtensionFromMime,
  detectMimeSignature,
} from "@/lib/storage"
import { ImageCategory } from "@prisma/client"

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "images")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const patientId = req.nextUrl.searchParams.get("patientId") || undefined
  const category = req.nextUrl.searchParams.get("category") || undefined

  const images = await prisma.patientImage.findMany({
    where: {
      clinicId: ctx.clinicId,
      ...(patientId ? { patientId } : {}),
      ...(category ? { category: category as ImageCategory } : {}),
    },
    orderBy: { takenAt: "desc" },
    select: {
      id: true,
      patientId: true,
      patient: { select: { id: true, fullName: true } },
      category: true,
      label: true,
      mimeType: true,
      sizeBytes: true,
      takenAt: true,
      notes: true,
    },
  })

  const includeRadiographs = category === undefined || category === "EXTRAORAL"
  const radiographs = includeRadiographs
    ? await prisma.radiograph.findMany({
        where: {
          clinicId: ctx.clinicId,
          ...(patientId ? { patientId } : {}),
        },
        orderBy: { takenAt: "desc" },
        select: {
          id: true,
          patientId: true,
          patient: { select: { id: true, fullName: true } },
          examType: true,
          label: true,
          mimeType: true,
          sizeBytes: true,
          takenAt: true,
          notes: true,
        },
      })
    : []

  const merged = [
    ...images.map((i) => ({
      kind: "image" as const,
      ...i,
      takenAt: i.takenAt.toISOString(),
      url: `/api/app/images/${i.id}/file`,
    })),
    ...radiographs.map((r) => ({
      kind: "radiograph" as const,
      ...r,
      category: "EXTRAORAL" as const,
      label: r.label || r.examType,
      takenAt: r.takenAt.toISOString(),
      url: `/api/app/radiographs/${r.id}/file`,
    })),
  ].sort((a, b) => (a.takenAt < b.takenAt ? 1 : a.takenAt > b.takenAt ? -1 : 0))

  return NextResponse.json({ images: merged })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })
  if (!hasModule(ctx, "images")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: "Formato inválido." }, { status: 400 })

  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 })

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Formato de arquivo não permitido." }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    return NextResponse.json({ error: "Arquivo excede o limite de 25MB." }, { status: 400 })
  }

  const patientId = String(form.get("patientId") || "")
  if (!patientId) return NextResponse.json({ error: "Paciente obrigatório." }, { status: 400 })

  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId: ctx.clinicId } })
  if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

  const categoryRaw = String(form.get("category") || "INTRAORAL")
  const category = Object.values(ImageCategory).includes(categoryRaw as ImageCategory)
    ? (categoryRaw as ImageCategory)
    : ImageCategory.INTRAORAL
  const label = String(form.get("label") || "").trim().slice(0, 190) || undefined
  const notes = String(form.get("notes") || "").trim().slice(0, 2000) || undefined
  const takenAt = form.get("takenAt") ? new Date(String(form.get("takenAt"))) : new Date()

  const buffer = Buffer.from(await file.arrayBuffer())
  const detectedMime = detectMimeSignature(buffer, file.type)
  if (!detectedMime) return NextResponse.json({ error: "Arquivo corrompido ou formato inválido." }, { status: 400 })

  const path = await saveFile(buffer, {
    tenantId: ctx.tenantId,
    subdir: ["images"],
    ext: fileExtensionFromMime(detectedMime),
  })

  try {
    const image = await prisma.patientImage.create({
      data: {
        clinicId: ctx.clinicId,
        patientId,
        category,
        label,
        path,
        mimeType: detectedMime,
        sizeBytes: file.size,
        takenAt,
        notes,
        userId: ctx.user.id,
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "image.create",
      entityType: "PatientImage",
      entityId: image.id,
      details: { patientId, category, sizeBytes: file.size },
    })

    return NextResponse.json({ ok: true, id: image.id })
  } catch (e) {
    await removeFile(path)
    console.error("PatientImage create error:", e)
    return NextResponse.json({ error: "Erro ao salvar imagem." }, { status: 500 })
  }
}