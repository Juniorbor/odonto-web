import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(120),
  type: z.enum(["TOMO", "TRACADO", "OUTRO", "FERNANDO", "BERNARDO"]).default("OUTRO"),
  price: z.coerce.number().min(0).max(99999999).optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })
  if (ctx.user.role !== "CLINIC_ADMIN") return NextResponse.json({ error: "Apenas administradores." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  }
  const d = parsed.data

  try {
    const existing = await prisma.productionCategory.findFirst({ where: { tenantId: ctx.tenantId, name: d.name } })
    if (existing) return NextResponse.json({ error: "Categoria já existe." }, { status: 409 })

    const cat = await prisma.productionCategory.create({
      data: {
        tenantId: ctx.tenantId,
        name: d.name,
        type: d.type as never,
        price: d.price ?? null,
      },
    })
    return NextResponse.json({ ok: true, id: cat.id })
  } catch (e) {
    console.error("Create category error:", e)
    return NextResponse.json({ error: "Erro ao criar categoria." }, { status: 500 })
  }
}