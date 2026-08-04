import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const clinicSchema = z.object({
  name: z.string().min(2).max(190).optional(),
  legalName: z.string().max(190).optional().or(z.literal("")),
  cnpj: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  whatsapp: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().max(190).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),
  city: z.string().max(120).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  cep: z.string().max(9).optional().or(z.literal("")),
  responsible: z.string().max(190).optional().or(z.literal("")),
  cro: z.string().max(60).optional().or(z.literal("")),
  reportHeader: z.string().max(2000).optional().or(z.literal("")),
  reportFooter: z.string().max(2000).optional().or(z.literal("")),
})

export async function GET() {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })

  const clinic = await prisma.clinic.findUnique({ where: { id: ctx.clinicId } })
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada." }, { status: 404 })

  return NextResponse.json({ clinic })
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (ctx.user.role !== "CLINIC_ADMIN") {
    return NextResponse.json({ error: "Apenas o administrador pode editar a clínica." }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = clinicSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(d)) {
      data[k] = typeof v === "string" ? (v.trim() ? v.trim() : null) : v
    }

    const clinic = await prisma.clinic.update({ where: { id: ctx.clinicId }, data })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "clinic_updated",
      entityType: "Clinic",
      entityId: clinic.id,
      details: { changed: Object.keys(data) },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Update clinic error:", e)
    return NextResponse.json({ error: "Erro ao atualizar clínica." }, { status: 500 })
  }
}