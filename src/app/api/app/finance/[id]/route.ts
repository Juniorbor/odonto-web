import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { parseLocalDate } from "@/lib/utils"
import { z } from "zod"

const patchSchema = z.object({
  status: z.enum(["PAID", "PENDING", "OVERDUE", "SCHEDULED"]).optional(),
  paidAt: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })

  const { id } = await params
  const kind = req.nextUrl.searchParams.get("kind") ?? "expense"

  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })
  const d = parsed.data

  try {
    if (kind === "expense") {
      const existing = await prisma.expense.findFirst({ where: { id, tenantId: ctx.tenantId } })
      if (!existing) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 })

      const data: Record<string, unknown> = {}
      if (d.status) {
        data.status = d.status as never
        data.paidAt = d.status === "PAID" ? (parseLocalDate(d.paidAt) ?? new Date()) : null
      }
      await prisma.expense.update({ where: { id }, data })

      await logAction({
        userId: ctx.user.id,
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        action: d.status === "PAID" ? "expense_paid" : "expense_updated",
        entityType: "Expense",
        entityId: id,
        details: { status: d.status },
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
    } else {
      const existing = await prisma.financialEntry.findFirst({ where: { id, tenantId: ctx.tenantId } })
      if (!existing) return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Patch finance error:", e)
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })

  const { id } = await params
  const kind = req.nextUrl.searchParams.get("kind") ?? "expense"

  try {
    if (kind === "expense") {
      const existing = await prisma.expense.findFirst({ where: { id, tenantId: ctx.tenantId } })
      if (!existing) return NextResponse.json({ error: "Despesa não encontrada." }, { status: 404 })
      await prisma.expense.delete({ where: { id } })
      await logAction({
        userId: ctx.user.id,
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        action: "expense_deleted",
        entityType: "Expense",
        entityId: id,
        details: { name: existing.name },
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
    } else {
      const existing = await prisma.financialEntry.findFirst({ where: { id, tenantId: ctx.tenantId } })
      if (!existing) return NextResponse.json({ error: "Lançamento não encontrado." }, { status: 404 })
      await prisma.financialEntry.delete({ where: { id } })
      await logAction({
        userId: ctx.user.id,
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        action: "income_deleted",
        entityType: "FinancialEntry",
        entityId: id,
        details: { description: existing.description },
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Delete finance error:", e)
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 })
  }
}