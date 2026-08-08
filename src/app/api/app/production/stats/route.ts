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

  const [records, cats] = await Promise.all([
    prisma.productionRecord.findMany({
      where: { tenantId: ctx.tenantId, date: { gte: from, lt: to }, status: "DONE" },
      select: { date: true, value: true, serviceName: true, serviceType: true, categoryId: true },
    }),
    prisma.productionCategory.findMany({
      where: { tenantId: ctx.tenantId },
      select: { id: true, name: true },
    }),
  ])

  const catMap = new Map(cats.map((c) => [c.id, c.name]))

  // Bucketiza a série no grupo selecionado
  const seriesMap = new Map<string, { label: string; count: number; value: number }>()
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

  for (const r of records) {
    const k = keyOf(r.date)
    const cur = seriesMap.get(k) ?? { label: labelOf(k), count: 0, value: 0 }
    cur.count += 1
    cur.value += r.value.toNumber()
    seriesMap.set(k, cur)
  }

  // Preenche períodos vazios para o eixo ficar contínuo
  const series: { label: string; count: number; value: number }[] = []
  if (gran === "day") {
    const [y, m] = monthRef.split("-").map(Number)
    const totalDays = new Date(y, m, 0).getDate()
    for (let d = 1; d <= totalDays; d++) {
      const k = String(d).padStart(2, "0")
      series.push(seriesMap.get(k) ?? { label: k, count: 0, value: 0 })
    }
  } else if (gran === "month") {
    for (let m = 1; m <= 12; m++) {
      const k = `${yearRef}-${String(m).padStart(2, "0")}`
      series.push(seriesMap.get(k) ?? { label: labelOf(k), count: 0, value: 0 })
    }
  } else {
    const years = [...new Set([...seriesMap.keys(), String(from.getFullYear())])].sort()
    for (const y of years) {
      series.push(seriesMap.get(y) ?? { label: y, count: 0, value: 0 })
    }
  }

  // Distribuição por serviço (rosca)
  const byService = new Map<string, { name: string; count: number; value: number }>()
  for (const r of records) {
    const name = r.serviceName || "Outro"
    const cur = byService.get(name) ?? { name, count: 0, value: 0 }
    cur.count += 1
    cur.value += r.value.toNumber()
    byService.set(name, cur)
  }

  // Distribuição por clínica (categoria)
  const byClinic = new Map<string, { name: string; count: number; value: number }>()
  for (const r of records) {
    const name = r.categoryId ? catMap.get(r.categoryId) ?? "Sem clínica" : "Sem clínica"
    const cur = byClinic.get(name) ?? { name, count: 0, value: 0 }
    cur.count += 1
    cur.value += r.value.toNumber()
    byClinic.set(name, cur)
  }

  const sortBy = <T>(arr: T[], k: keyof T): T[] => [...arr].sort((a, b) => (b[k] as number) - (a[k] as number))

  return NextResponse.json({
    group: gran,
    series,
    byService: sortBy([...byService.values()], "count").slice(0, 8).map((r) => ({ ...r, value: r.value })),
    byClinic: sortBy([...byClinic.values()], "count").slice(0, 8).map((r) => ({ ...r, value: r.value })),
  })
}