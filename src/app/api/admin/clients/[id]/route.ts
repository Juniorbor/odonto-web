import { NextRequest, NextResponse } from "next/server"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminMaster()
  const { id } = await params
  const body = await req.json().catch(() => null)

  const tenant = await prisma.tenant.findUnique({ where: { id } })
  if (!tenant) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 })

  const parsed = z
    .object({
      name: z.string().min(2).max(190).optional(),
      status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "EXPIRED", "CANCELLED"]).optional(),
      blockedReason: z.string().max(500).nullable().optional(),
    })
    .safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (parsed.data.name) data.name = parsed.data.name
  if (parsed.data.status) data.status = parsed.data.status
  if (parsed.data.blockedReason !== undefined) data.blockedReason = parsed.data.blockedReason

  const updated = await prisma.tenant.update({ where: { id }, data: data as never })

  await logAction({
    userId: admin.user.id,
    tenantId: id,
    action: "tenant_updated",
    entityType: "Tenant",
    entityId: id,
    details: data as never,
  })

  return NextResponse.json({ ok: true, tenant: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminMaster()
  const { id } = await params

  const tenant = await prisma.tenant.findUnique({ where: { id } })
  if (!tenant) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 })

  await prisma.tenant.delete({ where: { id } })

  await logAction({
    userId: admin.user.id,
    action: "tenant_deleted",
    entityType: "Tenant",
    entityId: id,
    details: { name: tenant.name } as never,
  })

  return NextResponse.json({ ok: true })
}