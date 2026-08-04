import Link from "next/link"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Users,
  Stethoscope,
  Briefcase,
  Wallet,
  AlertCircle,
  UserPlus,
  CalendarPlus,
  Smile,
  ScanLine,
  PlusCircle,
  BarChart3,
  Sparkles,
  ArrowRight,
  Activity,
  Clock,
} from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"

export default async function AppDashboard() {
  const ctx = await requireSession()

  const [patientCount, activePatients, appointmentsToday, appointmentsMonth, productionMonth, entriesMonth, pendingExpenses] =
    await Promise.all([
      ctx.isAdminMaster
        ? 0
        : prisma.patient.count({ where: { clinicId: ctx.clinicId! } }),
      ctx.isAdminMaster
        ? 0
        : prisma.patient.count({ where: { clinicId: ctx.clinicId!, active: true } }),
      ctx.isAdminMaster
        ? 0
        : prisma.appointment.count({
            where: {
              clinicId: ctx.clinicId!,
              startsAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lt: new Date(new Date().setHours(23, 59, 59, 999)),
              },
            },
          }),
      ctx.isAdminMaster
        ? 0
        : prisma.appointment.count({
            where: {
              clinicId: ctx.clinicId!,
              startsAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
              },
            },
          }),
      ctx.isAdminMaster || !hasModule(ctx, "production")
        ? null
        : prisma.productionRecord.aggregate({
            where: {
              tenantId: ctx.tenantId!,
              date: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
              },
              status: "DONE",
            },
            _sum: { value: true },
            _count: true,
          }),
      ctx.isAdminMaster || !hasModule(ctx, "finance")
        ? null
        : prisma.financialEntry.aggregate({
            where: {
              tenantId: ctx.tenantId!,
              date: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
              },
            },
            _sum: { value: true },
          }),
      ctx.isAdminMaster || !hasModule(ctx, "finance")
        ? null
        : prisma.expense.count({
            where: { tenantId: ctx.tenantId!, status: { in: ["PENDING", "OVERDUE"] } },
          }),
    ])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return "Bom dia"
    if (h < 18) return "Boa tarde"
    return "Boa noite"
  })()

  const firstName = ctx.user.name.split(" ")[0]

  const quickActions = ctx.isAdminMaster && !ctx.impersonating
    ? []
    : [
    { href: "/app/pacientes/novo", icon: <UserPlus className="h-4 w-4" />, label: "Novo paciente", module: "patients" },
    { href: "/app/atendimentos/novo", icon: <CalendarPlus className="h-4 w-4" />, label: "Novo atendimento", module: "appointments" },
    { href: "/app/odontograma", icon: <Smile className="h-4 w-4" />, label: "Odontograma", module: "odontogram" },
    { href: "/app/radiografias", icon: <ScanLine className="h-4 w-4" />, label: "Adicionar radiografia", module: "radiographs" },
    { href: "/app/producao", icon: <PlusCircle className="h-4 w-4" />, label: "Nova produção", module: "production" },
    { href: "/app/financeiro", icon: <Wallet className="h-4 w-4" />, label: "Financeiro", module: "finance" },
    { href: "/app/relatorios", icon: <BarChart3 className="h-4 w-4" />, label: "Gerar relatório", module: "reports" },
    { href: "/app/ia", icon: <Sparkles className="h-4 w-4" />, label: "Assistente IA", module: "ai" },
  ].filter((a) => ctx.isAdminMaster || !a.module || hasModule(ctx, a.module))

  const stats = [
    { label: "Pacientes cadastrados", value: patientCount, icon: <Users className="h-5 w-5" />, tone: "text-sky-400 bg-sky-500/10 border-sky-500/25" },
    { label: "Pacientes ativos", value: activePatients, icon: <Activity className="h-5 w-5" />, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
    { label: "Atendimentos hoje", value: appointmentsToday, icon: <Clock className="h-5 w-5" />, tone: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" },
    { label: "Atendimentos no mês", value: appointmentsMonth, icon: <Stethoscope className="h-5 w-5" />, tone: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25" },
    { label: "Produção no mês", value: productionMonth ? formatCurrency(productionMonth._sum.value?.toString()) : "—", icon: <Briefcase className="h-5 w-5" />, tone: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
    { label: "Receita do mês", value: entriesMonth ? formatCurrency(entriesMonth._sum.value?.toString()) : "—", icon: <Wallet className="h-5 w-5" />, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
    { label: "Contas pendentes", value: pendingExpenses ?? "—", icon: <AlertCircle className="h-5 w-5" />, tone: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
  ]

  const recentPatients = ctx.isAdminMaster
    ? []
    : await prisma.patient.findMany({
        where: { clinicId: ctx.clinicId! },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, fullName: true, phone: true, createdAt: true },
      })

  const upcomingAppointments = ctx.isAdminMaster
    ? []
    : await prisma.appointment.findMany({
        where: { clinicId: ctx.clinicId!, startsAt: { gte: new Date() }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
        orderBy: { startsAt: "asc" },
        take: 5,
        select: { id: true, startsAt: true, status: true, patient: { select: { id: true, fullName: true } } },
      })

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">
          {greeting}, Dr(a). <span className="text-gradient">{firstName}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Visão geral da sua prática odontológica.</p>
      </div>

      {/* Atalhos */}
      <div className="anim-fade-up stagger flex flex-wrap gap-2" style={{ animationDelay: "0.05s" }}>
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#1c2942] bg-[#0a1120] px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:-translate-y-0.5 hover:border-sky-600/50 hover:text-sky-300"
          >
            <span className="text-slate-500 transition group-hover:text-sky-400">{a.icon}</span>
            {a.label}
          </Link>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="anim-fade-up transition hover:-translate-y-0.5">
            <CardBody>
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${s.tone}`}>
                {s.icon}
              </div>
              <p className="text-xl font-bold text-white sm:text-2xl">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Próximos atendimentos */}
        <Card className="anim-fade-up">
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Próximos atendimentos</h3>
              <Link href="/app/agenda" className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300">
                Ver agenda <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {upcomingAppointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">Nenhum atendimento agendado.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingAppointments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/app/agenda`}
                    className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3 transition hover:border-sky-700/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{a.patient.fullName}</p>
                      <p className="text-xs text-slate-500">{formatDate(a.startsAt, true)}</p>
                    </div>
                    <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium text-sky-300">
                      {a.status === "CONFIRMED" ? "Confirmado" : "Agendado"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Últimos pacientes */}
        <Card className="anim-fade-up">
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Últimos pacientes</h3>
              <Link href="/app/pacientes" className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {recentPatients.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-600">Nenhum paciente cadastrado ainda.</p>
            ) : (
              <div className="space-y-2.5">
                {recentPatients.map((p) => (
                  <Link
                    key={p.id}
                    href={`/app/pacientes/${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3 transition hover:border-sky-700/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{p.fullName}</p>
                      <p className="text-xs text-slate-500">{p.phone || "Sem telefone"}</p>
                    </div>
                    <span className="text-[11px] text-slate-600">{formatDate(p.createdAt)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}