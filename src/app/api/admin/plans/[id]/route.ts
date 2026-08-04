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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminMaster()
  const { id } = await params
  const body = await req.json().catch(() => null)

  const plan = await prisma.plan.findUnique({ where: { id } })
  if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 })

  const parsed = z
    .object({
      name: z.string().min(2).max(120).optional(),
      description: z.string().max(500).nullable().optional(),
      price: z.coerce.number().min(0).optional(),
      modules: z.array(z.string()).optional(),
      userLimit: z.coerce.number().int().min(1).optional(),
      storageLimitBytes: z.coerce.number().int().min(0).optional(),
      active: z.boolean().optional(),
    })
    .safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  const data: Record<string, unknown> = { ...parsed.data }
  if (data.storageLimitBytes !== undefined) data.storageLimitBytes = BigInt(data.storageLimitBytes as number)

  const updated = await prisma.plan.update({ where: { id }, data: data as never })

  await logAction({
    userId: admin.user.id,
    action: "plan_updated",
    entityType: "Plan",
    entityId: id,
  })

  return NextResponse.json({ ok: true, plan: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminMaster()
  const { id } = await params
  await prisma.plan.delete({ where: { id } })
  await logAction({
    userId: admin.user.id,
    action: "plan_deleted",
    entityType: "Plan",
    entityId: id,
  })
  return NextResponse.json({ ok: true })
}