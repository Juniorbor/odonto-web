import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ExamType, ExpenseStatus, ProductionStatus, ProductionType } from "@prisma/client"

export type ReportType = "production" | "finance" | "patients"

export type ReportContext = {
  tenantId: string | null
  clinicId: string | null
  userName: string
}

export type ProductionRow = {
  code: string
  date: string
  patient: string
  service: string
  category: string
  value: string
  status: string
  notes: string
}

export type ProductionGroup = {
  key: string
  label: string
  rows: ProductionRow[]
  total: string
  count: number
}

export type FinanceRow = {
  date: string
  description: string
  category: string
  value: string
  extra: string
}

export type ExamRow = {
  type: string
  label: string
  date: string
  report: string
}

export type PatientRow = {
  name: string
  cpf: string
  birth: string
  sex: string
  phone: string
  status: string
  exams: ExamRow[]
}

export type ReportData = {
  clinicName: string
  reportHeader: string | null
  reportFooter: string | null
  generatedBy: string
  generatedAt: string
  type: ReportType
  monthKey: string
  monthLabel: string
  production: ProductionSection | null
  finance: FinanceSection | null
  patients: PatientsSection | null
}

export type ProductionSection = {
  groups: ProductionGroup[]
  total: string
  count: number
}

export type FinanceSection = {
  entries: FinanceRow[]
  expenses: FinanceRow[]
  incomeTotal: string
  expenseTotal: string
  result: string
  entryCount: number
  expenseCount: number
}

export type PatientsSection = {
  rows: PatientRow[]
  total: number
  withExams: number
}

const PRODUCTION_STATUS: Record<ProductionStatus, string> = {
  DONE: "Concluído",
  PENDING: "Pendente",
  CANCELLED: "Cancelado",
}

const EXPENSE_STATUS: Record<ExpenseStatus, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
  SCHEDULED: "Agendado",
}

export const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  PANORAMICA: "Panorâmica",
  PERIAPICAL: "Periapical",
  INTERPROXIMAL: "Interproximal",
  OCLUSAL: "Oclusal",
  TOMOGRAFIA: "Tomografia",
  CEFALOMETRIA: "Cefalometria",
  FOTOGRAFIA: "Fotografia",
  OUTRO: "Outro",
}

const PRODUCTION_GROUP_LABEL: Record<ProductionType, string> = {
  FERNANDO: "Fernando",
  BERNARDO: "Bernardo",
  TOMO: "Outros",
  TRACADO: "Outros",
  OUTRO: "Outros",
}

export function monthWindow(monthKey: string): { from: Date; to: Date } {
  const [year, m] = monthKey.split("-").map((v) => parseInt(v, 10))
  if (!year || !m || m < 1 || m > 12) throw new Error("Mês inválido.")
  return { from: new Date(year, m - 1, 1), to: new Date(year, m, 1) }
}

export function monthLabel(monthKey: string): string {
  const [year, m] = monthKey.split("-").map((v) => parseInt(v, 10))
  const date = new Date(year, m - 1, 1)
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
}

export async function buildReportData(
  type: ReportType,
  monthKey: string,
  ctx: ReportContext,
): Promise<ReportData> {
  const { from, to } = monthWindow(monthKey)

  const [clinic, tenant] = await Promise.all([
    ctx.clinicId ? prisma.clinic.findFirst({ where: { id: ctx.clinicId } }) : Promise.resolve(null),
    ctx.tenantId ? prisma.tenant.findFirst({ where: { id: ctx.tenantId } }) : Promise.resolve(null),
  ])

  const base: ReportData = {
    clinicName: clinic?.name ?? tenant?.name ?? "Clínica Odonto",
    reportHeader: clinic?.reportHeader ?? null,
    reportFooter: clinic?.reportFooter ?? null,
    generatedBy: ctx.userName,
    generatedAt: formatDate(new Date(), true),
    type,
    monthKey,
    monthLabel: monthLabel(monthKey),
    production: null,
    finance: null,
    patients: null,
  }

  if (type === "production" && ctx.tenantId) {
    const records = await prisma.productionRecord.findMany({
      where: { tenantId: ctx.tenantId, date: { gte: from, lt: to } },
      orderBy: [{ date: "asc" }, { code: "asc" }],
      select: {
        code: true,
        date: true,
        patientName: true,
        patientCode: true,
        serviceName: true,
        serviceType: true,
        value: true,
        status: true,
        notes: true,
        category: { select: { name: true } },
      },
    })

    const grouped = new Map<string, { rows: ProductionRow[]; total: number }>()
    let grandTotal = 0
    for (const r of records) {
      const key = PRODUCTION_GROUP_LABEL[r.serviceType] ?? "Outros"
      if (!grouped.has(key)) grouped.set(key, { rows: [], total: 0 })
      const value = Number(r.value ?? 0)
      grandTotal += value
      const g = grouped.get(key)!
      g.total += value
      g.rows.push({
        code: r.code,
        date: formatDate(r.date),
        patient: [r.patientName, r.patientCode].filter(Boolean).join(" · ") || "—",
        service: r.serviceName,
        category: r.category?.name ?? "—",
        value: formatCurrency(value),
        status: PRODUCTION_STATUS[r.status] ?? r.status,
        notes: r.notes ?? "",
      })
    }

    const groups: ProductionGroup[] = []
    for (const label of ["Fernando", "Bernardo", "Outros"]) {
      const group = grouped.get(label)
      if (!group || group.rows.length === 0) continue
      groups.push({
        key: label.toLowerCase(),
        label,
        rows: group.rows,
        total: formatCurrency(group.total),
        count: group.rows.length,
      })
    }

    base.production = {
      groups,
      total: formatCurrency(grandTotal),
      count: records.length,
    }
  }

  if (type === "finance" && ctx.tenantId) {
    const [entries, expenses] = await Promise.all([
      prisma.financialEntry.findMany({
        where: { tenantId: ctx.tenantId, date: { gte: from, lt: to } },
        orderBy: { date: "asc" },
        select: {
          description: true,
          value: true,
          date: true,
          recurring: true,
          notes: true,
          category: { select: { name: true } },
        },
      }),
      prisma.expense.findMany({
        where: { tenantId: ctx.tenantId, dueDate: { gte: from, lt: to } },
        orderBy: { dueDate: "asc" },
        select: {
          name: true,
          value: true,
          dueDate: true,
          status: true,
          paymentMethod: true,
          category: { select: { name: true } },
        },
      }),
    ])

    let incomeTotal = 0
    let expenseTotal = 0

    base.finance = {
      entries: entries.map((e) => {
        const value = Number(e.value ?? 0)
        incomeTotal += value
        return {
          date: formatDate(e.date),
          description: e.description,
          category: e.category?.name ?? "—",
          value: formatCurrency(value),
          extra: e.recurring ? "Recorrente" : "",
        }
      }),
      expenses: expenses.map((e) => {
        const value = Number(e.value ?? 0)
        expenseTotal += value
        return {
          date: formatDate(e.dueDate),
          description: e.name,
          category: e.category?.name ?? "—",
          value: formatCurrency(value),
          extra: [EXPENSE_STATUS[e.status] ?? e.status, e.paymentMethod].filter(Boolean).join(" · "),
        }
      }),
      incomeTotal: formatCurrency(incomeTotal),
      expenseTotal: formatCurrency(expenseTotal),
      result: formatCurrency(incomeTotal - expenseTotal),
      entryCount: entries.length,
      expenseCount: expenses.length,
    }
  }

  if (type === "patients" && ctx.clinicId) {
    const patients = await prisma.patient.findMany({
      where: { clinicId: ctx.clinicId },
      orderBy: { fullName: "asc" },
      select: {
        fullName: true,
        cpf: true,
        birthDate: true,
        sex: true,
        phone: true,
        active: true,
        radiographs: {
          select: { examType: true, label: true, takenAt: true, reportConclusion: true },
          orderBy: { takenAt: "desc" },
        },
      },
    })

    let withExams = 0
    base.patients = {
      rows: patients.map((p) => {
        if (p.radiographs.length > 0) withExams += 1
        return {
          name: p.fullName,
          cpf: p.cpf ?? "—",
          birth: p.birthDate ? formatDate(p.birthDate) : "—",
          sex: p.sex ?? "—",
          phone: p.phone ?? "—",
          status: p.active ? "Ativo" : "Inativo",
          exams: p.radiographs.map((r) => ({
            type: EXAM_TYPE_LABEL[r.examType] ?? r.examType,
            label: r.label ?? "—",
            date: formatDate(r.takenAt),
            report: r.reportConclusion ? "Laudo emitido" : "Sem laudo",
          })),
        }
      }),
      total: patients.length,
      withExams,
    }
  }

  return base
}
