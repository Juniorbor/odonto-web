import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import {
  saveFile,
  removeFile,
  fileExtensionFromMime,
  resolveUploadMime,
} from "@/lib/storage"
import { receiveChunkedUpload, type ReceiveChunkResult } from "@/lib/chunked-upload"
import { parseLocalDate } from "@/lib/utils"
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

  const patientId = String(form.get("patientId") || "")
  if (!patientId) return NextResponse.json({ error: "Paciente obrigatório." }, { status: 400 })

  const received = await receiveChunkedUpload(ctx.tenantId, form).catch((e) => ({
    done: false as const,
    error: (e as Error).message,
    status: 500,
  }) as ReceiveChunkResult)
  if (!received.done) {
    if (received.waiting) return NextResponse.json({ ok: true, waiting: received.waiting })
    return NextResponse.json({ error: received.error }, { status: received.status ?? 400 })
  }
  const buffer = received.buffer!

  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId: ctx.clinicId } })
  if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

  const categoryRaw = String(form.get("category") || "INTRAORAL")
  const category = Object.values(ImageCategory).includes(categoryRaw as ImageCategory)
    ? (categoryRaw as ImageCategory)
    : ImageCategory.INTRAORAL
  const label = String(form.get("label") || "").trim().slice(0, 190) || undefined
  const notes = String(form.get("notes") || "").trim().slice(0, 2000) || undefined
  const takenAt = parseLocalDate(String(form.get("takenAt") || "")) ?? new Date()

  const detectedMime = resolveUploadMime(fileNameFromForm(form), fileTypeFromForm(form), buffer)
  if (!detectedMime) return NextResponse.json({ error: "Formato de arquivo não permitido." }, { status: 400 })

  let path: string
  try {
    path = await saveFile(buffer, {
      tenantId: ctx.tenantId,
      subdir: ["images"],
      ext: fileExtensionFromMime(detectedMime),
    })
  } catch (e) {
    console.error("PatientImage saveFile error:", e)
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }

  try {
    const image = await prisma.patientImage.create({
      data: {
        clinicId: ctx.clinicId,
        patientId,
        category,
        label,
        path,
        mimeType: detectedMime,
        sizeBytes: buffer.length,
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
      details: { patientId, category, sizeBytes: buffer.length },
    })

    return NextResponse.json({ ok: true, id: image.id })
  } catch (e) {
    await removeFile(path)
    console.error("PatientImage create error:", e)
    return NextResponse.json({ error: "Erro ao salvar imagem." }, { status: 500 })
  }
}

function fileNameFromForm(form: FormData) {
  const file = form.get("chunk") ?? form.get("file")
  return file instanceof File ? file.name : ""
}

function fileTypeFromForm(form: FormData) {
  const file = form.get("chunk") ?? form.get("file")
  return file instanceof File ? file.type : ""
}