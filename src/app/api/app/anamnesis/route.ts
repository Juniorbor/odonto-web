import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const boolOrNull = z.enum(["true", "false"]).transform((v) => v === "true").or(z.boolean()).or(z.null()).optional()

const anamnesisSchema = z.object({
  patientId: z.string().min(1),
  signedByName: z.string().max(190).optional(),
  hasDisease: boolOrNull,
  diseaseDescription: z.string().max(2000).optional().or(z.literal("")),
  underMedicalTreatment: boolOrNull,
  treatmentDescription: z.string().max(2000).optional().or(z.literal("")),
  hospitalized: boolOrNull,
  surgeryHistory: boolOrNull,
  surgeryDescription: z.string().max(2000).optional().or(z.literal("")),
  cardiovascular: boolOrNull,
  hypertension: boolOrNull,
  diabetes: boolOrNull,
  respiratory: boolOrNull,
  renal: boolOrNull,
  hepatic: boolOrNull,
  coagulation: boolOrNull,
  infectious: boolOrNull,
  autoimmune: boolOrNull,
  cancerHistory: boolOrNull,
  epilepsy: boolOrNull,
  pressureChanges: boolOrNull,
  faintingHistory: boolOrNull,
  seizuresHistory: boolOrNull,
  hasMedicationAllergy: boolOrNull,
  anesthesiaReceived: boolOrNull,
  anesthesiaReaction: boolOrNull,
  anesthesiaDetails: z.string().max(2000).optional().or(z.literal("")),
  lastDentalVisit: z.string().optional().or(z.literal("")),
  hasPain: boolOrNull,
  painDescription: z.string().max(2000).optional().or(z.literal("")),
  sensitivity: boolOrNull,
  gumBleeding: boolOrNull,
  halitosis: boolOrNull,
  bruxism: boolOrNull,
  clenching: boolOrNull,
  dentalTrauma: boolOrNull,
  orthodonticTreatment: boolOrNull,
  prostheses: boolOrNull,
  implants: boolOrNull,
  previousSurgeries: boolOrNull,
  brushFrequency: z.string().max(120).optional().or(z.literal("")),
  flossUse: boolOrNull,
  mouthwashUse: boolOrNull,
  smoking: boolOrNull,
  alcohol: boolOrNull,
  nailBiting: boolOrNull,
  parafunctionalHabits: boolOrNull,
  habitsDetails: z.string().max(2000).optional().or(z.literal("")),
  familyHistory: z.string().max(4000).optional().or(z.literal("")),
  observations: z.string().max(4000).optional().or(z.literal("")),
})

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "anamnesis") && !hasModule(ctx, "patients")) {
    return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = anamnesisSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const patient = await prisma.patient.findFirst({ where: { id: d.patientId, clinicId: ctx.clinicId } })
    if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

    const latest = await prisma.medicalHistory.findFirst({
      where: { patientId: d.patientId },
      orderBy: { version: "desc" },
      select: { version: true },
    })

    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(d)) {
      if (k === "patientId") continue
      if (k === "lastDentalVisit") data[k] = v ? new Date(v as string) : null
      else if (typeof v === "string" && !v) data[k] = null
      else data[k] = v
    }

    const history = await prisma.medicalHistory.create({
      data: {
        patientId: d.patientId,
        version: (latest?.version ?? 0) + 1,
        signedByName: d.signedByName,
        signedAt: new Date(),
        ...data,
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "anamnesis_created",
      entityType: "MedicalHistory",
      entityId: history.id,
      details: { patientId: d.patientId, version: history.version },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, id: history.id })
  } catch (e) {
    console.error("Create anamnesis error:", e)
    return NextResponse.json({ error: "Erro ao salvar anamnese." }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const patientId = req.nextUrl.searchParams.get("patientId")
  if (!patientId) return NextResponse.json({ error: "patientId obrigatório." }, { status: 400 })

  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId: ctx.clinicId } })
  if (!patient) return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 })

  const histories = await prisma.medicalHistory.findMany({
    where: { patientId },
    orderBy: { version: "desc" },
    include: { medications: true, allergies: true },
  })

  return NextResponse.json({
    histories: histories.map((h) => ({
      ...h,
      signedAt: h.signedAt?.toISOString() ?? null,
      lastDentalVisit: h.lastDentalVisit?.toISOString() ?? null,
      createdAt: h.createdAt.toISOString(),
    })),
  })
}