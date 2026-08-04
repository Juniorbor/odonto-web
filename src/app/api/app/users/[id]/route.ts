import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { logAction, getClientIp } from "@/lib/audit"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).max(190).optional(),
  role: z.enum(["CLINIC_ADMIN", "PROFESSIONAL", "RECEPTION"]).optional(),
  title: z.string().max(120).optional(),
  phone: z.string().max(30).optional(),
  password: z.string().min(6).max(200).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (ctx.user.role !== "CLINIC_ADMIN") {
    return NextResponse.json({ error: "Apenas administradores podem editar usuários." }, { status: 403 })
  }

  const { id } = await params
  if (id === ctx.user.id) {
    return NextResponse.json({ error: "Você não pode editar o próprio usuário aqui." }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const ip = await getClientIp(req.headers)
    const target = await prisma.user.findFirst({ where: { id, clinicId: ctx.clinicId } })
    if (!target) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (d.name !== undefined) data.name = d.name
    if (d.role !== undefined) data.role = d.role
    if (d.title !== undefined) data.title = d.title
    if (d.phone !== undefined) data.phone = d.phone
    if (d.active !== undefined) data.active = d.active
    if (d.password !== undefined) data.passwordHash = await hashPassword(d.password)

    await prisma.user.update({ where: { id }, data })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "user_updated",
      entityType: "User",
      entityId: id,
      details: { changed: Object.keys(data), name: d.name } as never,
      ip,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Update user error:", e)
    return NextResponse.json({ error: "Erro ao atualizar usuário." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (ctx.user.role !== "CLINIC_ADMIN") {
    return NextResponse.json({ error: "Apenas administradores podem remover usuários." }, { status: 403 })
  }

  const { id } = await params
  if (id === ctx.user.id) {
    return NextResponse.json({ error: "Você não pode remover a si mesmo." }, { status: 400 })
  }

  try {
    const ip = await getClientIp(req.headers)
    const target = await prisma.user.findFirst({ where: { id, clinicId: ctx.clinicId } })
    if (!target) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })

    await prisma.user.update({ where: { id }, data: { active: false, clinicId: null } })

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "user_removed",
      entityType: "User",
      entityId: id,
      details: { name: target.name, email: target.email } as never,
      ip,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete user error:", e)
    return NextResponse.json({ error: "Erro ao remover usuário." }, { status: 500 })
  }
}