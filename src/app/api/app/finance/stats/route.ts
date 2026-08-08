import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

type Granularity = "day" | "month" | "year"

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })

  const gran = (req.nextUrl.searchParams.get("group") as Granularity) || "day"
  const now = new Date()
  const monthRef = req.nextUrl.searchParams.get("month") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const yearRef = Number(req.nextUrl.searchParams.get("year")) || now.getFullYear()

  let from: Date, to: Date
  if (gran === "day") {
    const [y, m] = monthRef.split("-").map(Number)
    from = new Date(y, m - 1, 1)
    to = new Date(y, m, 1)
  } else if (gran === "month") {
    from = new Date(yearRef, 0, 1)
    to = new Date(yearRef + 1, 0, 1)
  } else {
    from = new Date(2020, 0, 1)
    to = new Date(2100, 0, 1)
  }

  const [entries, expenses] = await Promise.all([
    prisma.financialEntry.findMany({
      where: { tenantId: ctx.tenantId, date: { gte: from, lt: to } },
      select: { date: true, value: true, categoryId: true },
    }),
    prisma.expense.findMany({
      where: { tenantId: ctx.tenantId, dueDate: { gte: from, lt: to } },
      select: { dueDate: true, value: true, categoryId: true },
    }),
  ])

  const entriesCat = await prisma.financialCategory.findMany({
    where: { tenantId: ctx.tenantId, type: "ENTRADA" },
    select: { id: true, name: true },
  })
  const expensesCat = await prisma.financialCategory.findMany({
    where: { tenantId: ctx.tenantId, NOT: { type: "ENTRADA" } },
    select: { id: true, name: true },
  })

  const entriesCatMap = new Map(entriesCat.map((c) => [c.id, c.name]))
  const expensesCatMap = new Map(expensesCat.map((c) => [c.id, c.name]))

  const keyOf = (d: Date): string => {
    if (gran === "day") return String(d.getDate()).padStart(2, "0")
    if (gran === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    return String(d.getFullYear())
  }
  const labelOf = (k: string): string => {
    if (gran === "day") return k
    if (gran === "month") {
      const [y, m] = k.split("-")
      return `${MONTHS[Number(m) - 1]}/${y.slice(2)}`
    }
    return k
  }

  const seriesMap = new Map<string, { label: string; income: number; expense: number }>()
  const bump = (k: string, field: "income" | "expense", v: number) => {
    const cur = seriesMap.get(k) ?? { label: labelOf(k), income: 0, expense: 0 }
    cur[field] += v
    seriesMap.set(k, cur)
  }

  for (const e of entries) bump(keyOf(e.date), "income", e.value.toNumber())
  for (const e of expenses) bump(keyOf(e.dueDate), "expense", e.value.toNumber())

  const series: { label: string; income: number; expense: number }[] = []
  if (gran === "day") {
    const [y, m] = monthRef.split("-").map(Number)
    const totalDays = new Date(y, m, 0).getDate()
    for (let d = 1; d <= totalDays; d++) {
      const k = String(d).padStart(2, "0")
      series.push(seriesMap.get(k) ?? { label: k, income: 0, expense: 0 })
    }
  } else if (gran === "month") {
    for (let m = 1; m <= 12; m++) {
      const k = `${yearRef}-${String(m).padStart(2, "0")}`
      series.push(seriesMap.get(k) ?? { label: labelOf(k), income: 0, expense: 0 })
    }
  } else {
    const years = [...new Set([...seriesMap.keys(), String(from.getFullYear())])].sort()
    for (const y of years) {
      series.push(seriesMap.get(y) ?? { label: y, income: 0, expense: 0 })
    }
  }

  const incomeByCat = new Map<string, number>()
  const expenseByCat = new Map<string, number>()
  for (const e of entries) {
    const name = e.categoryId ? entriesCatMap.get(e.categoryId) ?? "Sem categoria" : "Sem categoria"
    incomeByCat.set(name, (incomeByCat.get(name) ?? 0) + e.value.toNumber())
  }
  for (const e of expenses) {
    const name = e.categoryId ? expensesCatMap.get(e.categoryId) ?? "Sem categoria" : "Sem categoria"
    expenseByCat.set(name, (expenseByCat.get(name) ?? 0) + e.value.toNumber())
  }

  const bucket2 = (m: Map<string, number>) =>
    [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  return NextResponse.json({
    group: gran,
    series,
    incomeByCat: bucket2(incomeByCat),
    expenseByCat: bucket2(expenseByCat),
  })
}