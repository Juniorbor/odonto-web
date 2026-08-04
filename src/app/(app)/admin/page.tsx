import Link from "next/link"
import { redirect } from "next/navigation"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Building2,
  Users,
  UserCheck,
  Sparkles,
  HardDrive,
  CreditCard,
  Clock,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Plus,
} from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

export default async function AdminDashboard() {
  const ctx = await requireSession()
  if (!ctx.isAdminMaster) redirect("/app")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const in7Days = new Date(now.getTime() + 7 * 24 * 3600 * 1000)

  const [
    tenants,
    activeTenants,
    trivTenants,
    newTenants,
    users,
    activeUsers,
    patients,
    appointments,
    aiUsage,
    storageUsers,
    activeSubs,
    expiringSubs,
    recentTenants,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } }),
    prisma.tenant.count({ where: { status: { in: ["SUSPENDED", "EXPIRED", "CANCELLED"] } } }),
    prisma.tenant.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count(),
    prisma.user.count({ where: { active: true, role: { not: "ADMIN_MASTER" } } }),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.aiInteraction.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.backupRecord.count(),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIAL"] } } }),
    prisma.subscription.count({ where: { endDate: { gte: now, lte: in7Days }, status: "ACTIVE" } }),
    prisma.tenant.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { _count: { select: { clinics: true, subscriptions: true } } } }),
  ])

  const stats = [
    { label: "Clientes ativos", value: activeTenants, icon: <Building2 className="h-5 w-5" />, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
    { label: "Clientes inativos", value: trivTenants, icon: <ShieldAlert className="h-5 w-5" />, tone: "text-rose-400 bg-rose-500/10 border-rose-500/25" },
    { label: "Novos clientes (mês)", value: newTenants, icon: <TrendingUp className="h-5 w-5" />, tone: "text-sky-400 bg-sky-500/10 border-sky-500/25" },
    { label: "Usuários ativos", value: activeUsers, icon: <Users className="h-5 w-5" />, tone: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25" },
    { label: "Pacientes cadastrados", value: patients, icon: <Users className="h-5 w-5" />, tone: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25" },
    { label: "Atendimentos realizados", value: appointments, icon: <Users className="h-5 w-5" />, tone: "text-violet-400 bg-violet-500/10 border-violet-500/25" },
    { label: "Uso da IA (mês)", value: aiUsage, icon: <Sparkles className="h-5 w-5" />, tone: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/25" },
    { label: "Assinaturas ativas", value: activeSubs, icon: <CreditCard className="h-5 w-5" />, tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Painel <span className="text-gradient">Administrativo</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Visão geral da plataforma e dos clientes.</p>
        </div>
        <Link
          href="/admin/clientes/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" /> Novo cliente
        </Link>
      </div>

      {/* Alertas: vencimento */}
      {expiringSubs > 0 && (
        <div className="anim-fade-up flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <Clock className="h-5 w-5 text-amber-400" />
          <p className="flex-1 text-sm text-amber-200">
            <strong>{expiringSubs}</strong> assinatura(s) próxima(s) do vencimento nos próximos 7 dias.
          </p>
          <Link href="/admin/clientes" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
            Revisar clientes
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="anim-fade-up">
            <CardBody>
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${s.tone}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="anim-fade-up">
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Clientes recentes</h3>
              <Link href="/admin/clientes" className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300">
                Gerenciar clientes <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentTenants.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-600">Nenhum cliente cadastrado.</p>
              ) : (
                recentTenants.map((t) => (
                  <Link
                    key={t.id}
                    href={`/admin/clientes/${t.id}`}
                    className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3 transition hover:border-sky-700/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{t.name}</p>
                      <p className="text-xs text-slate-500">
                        {t._count.clinics} clínica(s) • {t._count.subscriptions} assinatura(s)
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
                      {t.status}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <div className="anim-fade-up space-y-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400">
                  <HardDrive className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-100">Armazenamento</p>
                  <p className="text-xs text-slate-500">Arquivos isolados por cliente — seguros e auditados</p>
                </div>
                <Link href="/admin/backup" className="text-sm font-medium text-sky-400 hover:text-sky-300">
                  Backup
                </Link>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-100">Receita recorrente</p>
                  <p className="text-xs text-slate-500">Fonte de planos configurável pelo administrador</p>
                </div>
                <Link href="/admin/planos" className="text-sm font-medium text-sky-400 hover:text-sky-300">
                  Planos
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}