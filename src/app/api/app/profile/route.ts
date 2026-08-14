import { NextRequest, NextResponse } from "next/server"
import { requireSession, hashPassword, clearSessionCache } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().min(2).max(190).optional(),
  phone: z.string().max(30).optional().or(z.literal("")),
  title: z.string().max(120).optional().or(z.literal("")),
  avatarUrl: z.string().max(500).optional().or(z.literal("")),
  currentPassword: z.string().min(6).max(200).optional(),
  newPassword: z.string().min(6).max(200).optional(),
})

export async function PATCH(req: NextRequest) {
  const ctx = await requireSession()

  const body = await req.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
  }
  const d = parsed.data

  try {
    const data: Record<string, unknown> = {}
    if (d.name !== undefined) data.name = d.name.trim()
    if (d.phone !== undefined) data.phone = d.phone || null
    if (d.title !== undefined) data.title = d.title || null
    if (d.avatarUrl !== undefined) data.avatarUrl = d.avatarUrl || null

    if (d.newPassword) {
      if (!d.currentPassword) {
        return NextResponse.json({ error: "Informe a senha atual para definir uma nova." }, { status: 400 })
      }
      const user = await prisma.user.findUnique({ where: { id: ctx.user.id }, select: { passwordHash: true } })
      if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 })

      const { verifyPassword } = await import("@/lib/auth")
      const ok = await verifyPassword(d.currentPassword, user.passwordHash)
      if (!ok) return NextResponse.json({ error: "A senha atual está incorreta." }, { status: 403 })

      data.passwordHash = await hashPassword(d.newPassword)
    }

    const user = await prisma.user.update({ where: { id: ctx.user.id }, data })

    clearSessionCache(user.id)

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "profile_updated",
      entityType: "User",
      entityId: user.id,
      details: { changed: Object.keys(data).filter((k) => k !== "passwordHash") },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Update profile error:", e)
    return NextResponse.json({ error: "Erro ao atualizar perfil." }, { status: 500 })
  }
}