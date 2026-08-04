import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BarChart3, Briefcase, TrendingUp, Users, Wallet } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/feedback"
import { formatCurrency } from "@/lib/utils"

export default async function RelatoriosIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "reports")) redirect("/app")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const clinicId = ctx.clinicId
  const tenantId = ctx.tenantId

  const [patientCount, patientsByMonth, apptsMonth, prodAgg, incomeAgg, expenseAgg, pendingExpenses] = await Promise.all([
    clinicId
      ? prisma.patient.count({ where: { clinicId } })
      : Promise.resolve(0),
    clinicId
      ? prisma.patient.count({ where: { clinicId, createdAt: { gte: monthStart, lt: monthEnd } } })
      : Promise.resolve(0),
    clinicId
      ? prisma.appointment.count({ where: { clinicId, startsAt: { gte: monthStart, lt: monthEnd } } })
      : Promise.resolve(0),
    tenantId
      ? prisma.productionRecord.aggregate({
          where: { tenantId, date: { gte: monthStart, lt: monthEnd }, status: "DONE" },
          _sum: { value: true },
          _count: true,
        })
      : Promise.resolve(null),
    tenantId
      ? prisma.financialEntry.aggregate({
          where: { tenantId, date: { gte: monthStart, lt: monthEnd } },
          _sum: { value: true },
        })
      : Promise.resolve(null),
    tenantId
      ? prisma.expense.aggregate({
          where: { tenantId, dueDate: { gte: monthStart, lt: monthEnd } },
          _sum: { value: true },
        })
      : Promise.resolve(null),
    tenantId
      ? prisma.expense.count({ where: { tenantId, status: { in: ["PENDING", "OVERDUE"] } } })
      : Promise.resolve(0),
  ])

  const productionValue = Number(prodAgg?._sum.value ?? 0)
  const incomeValue = Number(incomeAgg?._sum.value ?? 0)
  const expenseValue = Number(expenseAgg?._sum.value ?? 0)

  const stats = [
    {
      label: "Pacientes totais",
      value: patientCount,
      note: `${patientsByMonth} novos neste mês`,
      icon: <Users className="h-5 w-5" />,
      tone: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    },
    {
      label: "Atendimentos no mês",
      value: apptsMonth,
      note: "agendamentos no período",
      icon: <BarChart3 className="h-5 w-5" />,
      tone: "text-violet-400 bg-violet-500/10 border-violet-500/25",
    },
    {
      label: "Produção no mês",
      value: formatCurrency(productionValue),
      note: `${prodAgg?._count ?? 0} serviços concluídos`,
      icon: <Briefcase className="h-5 w-5" />,
      tone: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",
    },
    {
      label: "Receita do mês",
      value: formatCurrency(incomeValue),
      note: "entradas no período",
      icon: <TrendingUp className="h-5 w-5" />,
      tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      label: "Despesas do mês",
      value: formatCurrency(expenseValue),
      note: `${pendingExpenses} pendentes`,
      icon: <Wallet className="h-5 w-5" />,
      tone: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    },
    {
      label: "Resultado do mês",
      value: formatCurrency(incomeValue - expenseValue),
      note: "receita − despesas",
      icon: <TrendingUp className="h-5 w-5" />,
      tone: incomeValue - expenseValue >= 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" : "text-rose-400 bg-rose-500/10 border-rose-500/25",
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">
          Relatórios <span className="text-gradient">gerenciais</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Visão consolidada do desempenho da clínica no mês atual.</p>
      </div>

      <div className="anim-fade-up grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="anim-fade-up transition hover:-translate-y-0.5">
            <CardBody>
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${s.tone}`}>
                {s.icon}
              </div>
              <p className="text-xl font-bold text-white sm:text-2xl">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-600">{s.note}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="anim-fade-up">
        <CardBody>
          <EmptyState
            icon="file"
            title="Relatórios detalhados"
            description="Filtros avançados por período, profissional e procedimento serão liberados nas próximas versões."
          />
        </CardBody>
      </Card>
    </div>
  )
}