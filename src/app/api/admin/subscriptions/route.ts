import { NextRequest, NextResponse } from "next/server"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const schema = z.object({
  tenantId: z.string(),
  planId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "TRIAL", "SUSPENDED", "EXPIRED", "CANCELLED"]),
  notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const admin = await requireAdminMaster()
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  const d = parsed.data

  const plan = await prisma.plan.findUnique({ where: { id: d.planId } })
  const tenant = await prisma.tenant.findUnique({ where: { id: d.tenantId } })
  if (!plan || !tenant) return NextResponse.json({ error: "Plano ou cliente não encontrado." }, { status: 404 })

  await prisma.subscription.updateMany({
    where: { tenantId: d.tenantId, status: { in: ["ACTIVE", "TRIAL"] } },
    data: { status: "EXPIRED" },
  })

  const sub = await prisma.subscription.create({
    data: {
      tenantId: d.tenantId,
      planId: plan.id,
      startDate: d.startDate ? new Date(d.startDate) : new Date(),
      endDate: d.endDate ? new Date(d.endDate) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
      status: d.status,
      userLimit: plan.userLimit,
      storageLimitBytes: plan.storageLimitBytes,
      modules: plan.modules,
      notes: d.notes,
      renewals: 1,
    },
  })

  await prisma.tenant.update({
    where: { id: d.tenantId },
    data: { status: d.status === "TRIAL" ? "TRIAL" : "ACTIVE", planName: plan.name },
  })

  await logAction({
    userId: admin.user.id,
    tenantId: d.tenantId,
    action: "subscription_created",
    entityType: "Subscription",
    entityId: sub.id,
    details: { plan: plan.name, status: d.status } as never,
  })

  return NextResponse.json({ ok: true, id: sub.id })
}