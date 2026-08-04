import { NextRequest, NextResponse } from "next/server"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0),
  modules: z.array(z.string()).default([]),
  userLimit: z.coerce.number().int().min(1).default(1),
  storageLimitBytes: z.coerce.number().int().min(0).default(1073741824),
  active: z.boolean().default(true),
})

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isGlobal: true },
    orderBy: { price: "asc" },
    select: { id: true, name: true, price: true, description: true, active: true, userLimit: true, modules: true },
  })
  return NextResponse.json({ plans })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminMaster()
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  const d = parsed.data

  const plan = await prisma.plan.create({
    data: {
      name: d.name,
      description: d.description,
      price: d.price as never,
      modules: d.modules,
      userLimit: d.userLimit,
      storageLimitBytes: BigInt(d.storageLimitBytes),
      active: d.active,
      isGlobal: true,
    },
  })

  await logAction({
    userId: admin.user.id,
    action: "plan_created",
    entityType: "Plan",
    entityId: plan.id,
    details: { name: plan.name } as never,
  })

  return NextResponse.json({ ok: true, id: plan.id })
}