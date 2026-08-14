import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const createSchema = z.object({
  fullName: z.string().min(2).max(190),
  socialName: z.string().max(190).optional(),
  cpf: z.string().max(20).optional().or(z.literal("")),
  rg: z.string().max(30).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  sex: z.string().max(20).optional().or(z.literal("")),
  maritalStatus: z.string().max(30).optional().or(z.literal("")),
  occupation: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().max(190).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  cep: z.string().max(9).optional().or(z.literal("")),
  guardian: z.string().max(190).optional().or(z.literal("")),
  observations: z.string().max(2000).optional().or(z.literal("")),
})

function clean(v: string | undefined | null) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined
}

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "patients")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const q = (req.nextUrl.searchParams.get("q") || "").trim()
  const status = req.nextUrl.searchParams.get("status") || "all"
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("pageSize") || "20", 10) || 20))

  const where: Record<string, unknown> = { clinicId: ctx.clinicId }
  if (q) {
    where.OR = [
      { id: { contains: q, mode: "insensitive" } },
      { fullName: { contains: q, mode: "insensitive" } },
      { cpf: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ]
  }
  if (status === "active") where.active = true
  if (status === "inactive") where.active = false

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        photoUrl: true,
        fullName: true,
        socialName: true,
        cpf: true,
        birthDate: true,
        sex: true,
        phone: true,
        whatsapp: true,
        email: true,
        active: true,
        createdAt: true,
        clinic: { select: { name: true } },
        _count: { select: { appointments: true, clinicalRecords: true } },
      },
    }),
  ])

  return NextResponse.json({
    patients: patients.map((p) => ({
      ...p,
      birthDate: p.birthDate?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "patients")) return NextResponse.json({ error: "Módulo indisponível." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const patient = await prisma.patient.create({
      data: {
        clinicId: ctx.clinicId,
        fullName: d.fullName.trim(),
        socialName: clean(d.socialName),
        cpf: clean(d.cpf),
        rg: clean(d.rg),
        birthDate: clean(d.birthDate) ? new Date(d.birthDate!) : undefined,
        sex: clean(d.sex),
        maritalStatus: clean(d.maritalStatus),
        occupation: clean(d.occupation),
        phone: clean(d.phone),
        whatsapp: clean(d.whatsapp),
        email: clean(d.email),
        address: clean(d.address),
        city: clean(d.city),
        state: clean(d.state),
        cep: clean(d.cep),
        guardian: clean(d.guardian),
        observations: clean(d.observations),
      },
    })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "patient_created",
      entityType: "Patient",
      entityId: patient.id,
      details: { name: patient.fullName },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true, id: patient.id })
  } catch (e) {
    console.error("Create patient error:", e)
    return NextResponse.json({ error: "Erro ao criar paciente." }, { status: 500 })
  }
}