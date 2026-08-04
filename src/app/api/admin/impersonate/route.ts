import { NextResponse } from "next/server"
import { getSessionContext, setImpersonationCookie, clearImpersonationCookie, requestIsSecure } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const ctx = await getSessionContext()
  if (!ctx?.isAdminMaster) return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const clinicId = typeof body?.clinicId === "string" ? body.clinicId : null
  if (!clinicId) return NextResponse.json({ ok: false, error: "clinicId obrigatório." }, { status: 400 })

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, tenant: { select: { status: true } } },
  })
  if (!clinic) return NextResponse.json({ ok: false, error: "Clínica não encontrada." }, { status: 404 })
  if (clinic.tenant.status !== "ACTIVE" && clinic.tenant.status !== "TRIAL") {
    return NextResponse.json({ ok: false, error: "Cliente inativo." }, { status: 400 })
  }

  await setImpersonationCookie(clinicId, { secure: requestIsSecure(req) })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const ctx = await getSessionContext()
  if (!ctx?.isAdminMaster) return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 403 })
  await clearImpersonationCookie()
  return NextResponse.json({ ok: true })
}
