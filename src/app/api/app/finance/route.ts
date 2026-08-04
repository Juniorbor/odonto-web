import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import { parseLocalDate } from "@/lib/utils"
import { z } from "zod"

const entrySchema = z.object({
  description: z.string().min(2).max(190),
  value: z.coerce.number().min(0.01).max(99999999),
  date: z.string().optional(),
  categoryId: z.string().optional().or(z.literal("")),
  recurring: z.boolean().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
})

const expenseSchema = z.object({
  name: z.string().min(2).max(190),
  type: z.enum(["FIXA", "VARIAVEL"]).default("VARIAVEL"),
  value: z.number().positive(),
  dueDate: z.string(),
  status: z.enum(["PAID", "PENDING", "OVERDUE", "SCHEDULED"]).default("PENDING"),
  paymentMethod: z.string().max(60).optional().or(z.literal("")),
  categoryId: z.string().optional().or(z.literal("")),
  recurring: z.boolean().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
})

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })

  const month = req.nextUrl.searchParams.get("month")
  const [year, m] = month ? month.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1]
  const from = new Date(year, m - 1, 1)
  const to = new Date(year, m, 1)

  const [entries, expenses, categories, incomeAgg, expenseAgg] = await Promise.all([
    prisma.financialEntry.findMany({
      where: { tenantId: ctx.tenantId, date: { gte: from, lt: to } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        description: true,
        value: true,
        date: true,
        recurring: true,
        notes: true,
        category: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.expense.findMany({
      where: { tenantId: ctx.tenantId, dueDate: { gte: from, lt: to } },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        value: true,
        dueDate: true,
        status: true,
        paymentMethod: true,
        category: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.financialCategory.findMany({
      where: { tenantId: ctx.tenantId, active: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.financialEntry.aggregate({
      where: { tenantId: ctx.tenantId, date: { gte: from, lt: to } },
      _sum: { value: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { tenantId: ctx.tenantId, dueDate: { gte: from, lt: to } },
      _sum: { value: true },
      _count: true,
    }),
  ])

  return NextResponse.json({
    entries: entries.map((e) => ({ ...e, value: e.value.toString(), date: e.date.toISOString() })),
    expenses: expenses.map((e) => ({ ...e, value: e.value.toString(), dueDate: e.dueDate.toISOString() })),
    categories: categories.map((c) => ({ ...c })),
    incomeTotal: incomeAgg._sum.value?.toString() ?? "0",
    expenseTotal: expenseAgg._sum.value?.toString() ?? "0",
  })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })
  if (!hasModule(ctx, "finance")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })

  try {
    if (body.kind === "expense") {
      const parsed = expenseSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
      }
      const d = parsed.data
      const expense = await prisma.expense.create({
        data: {
          tenantId: ctx.tenantId,
          clinicId: ctx.clinicId,
          userId: ctx.user.id,
          name: d.name,
          type: (d.type === "FIXA" ? "FIXA" : "VARIAVEL") as never,
          value: d.value,
          dueDate: parseLocalDate(d.dueDate) ?? new Date(),
          status: d.status as never,
          paymentMethod: d.paymentMethod || null,
          categoryId: d.categoryId || null,
          recurring: d.recurring,
          notes: d.notes,
        },
      })
      await logAction({
        userId: ctx.user.id,
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        action: "expense_created",
        entityType: "Expense",
        entityId: expense.id,
        details: { name: d.name, value: d.value },
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      })
      return NextResponse.json({ ok: true, id: expense.id })
    }

    const parsed = entrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 })
    }
    const d = parsed.data
    const entry = await prisma.financialEntry.create({
      data: {
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        userId: ctx.user.id,
        description: d.description,
        value: d.value,
        date: parseLocalDate(d.date) ?? new Date(),
        categoryId: d.categoryId || null,
        recurring: d.recurring,
        notes: d.notes,
      },
    })
    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "income_created",
      entityType: "FinancialEntry",
      entityId: entry.id,
      details: { description: d.description, value: d.value },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })
    return NextResponse.json({ ok: true, id: entry.id })
  } catch (e) {
    console.error("Create finance error:", e)
    return NextResponse.json({ error: "Erro ao registrar." }, { status: 500 })
  }
}