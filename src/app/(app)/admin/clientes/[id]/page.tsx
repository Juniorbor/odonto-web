import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, Building2, Users, UserCircle2, CreditCard, History, ShieldAlert } from "lucide-react"
import { Card, CardHeader, CardBody, Badge } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { TenantStatusBadge } from "@/components/admin/tenant-status-badge"
import { TenantManage } from "@/components/admin/tenant-manage"
import { SubscriptionForm } from "@/components/admin/subscription-form"
import { EnterClinicButton } from "@/components/admin/enter-clinic-button"

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminMaster()
  const { id } = await params

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      clinics: { include: { users: { select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true } } } },
      subscriptions: { orderBy: { createdAt: "desc" }, include: { plan: true } },
      productionCategories: true,
      financialCategories: true,
      _count: { select: { aiInteractions: true } },
    },
  })
  if (!tenant) notFound()

  const clinic = tenant.clinics[0]
  const patientCount = clinic ? await prisma.patient.count({ where: { clinicId: clinic.id } }) : 0
  const appointmentCount = clinic ? await prisma.appointment.count({ where: { clinicId: clinic.id } }) : 0
  const activeSub = tenant.subscriptions.find((s) => s.status === "ACTIVE" || s.status === "TRIAL")
  const plans = await prisma.plan.findMany({ where: { isGlobal: true, active: true }, orderBy: { price: "asc" } })

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up flex flex-wrap items-center gap-3">
        <Link href="/admin/clientes" className="rounded-lg border border-[#23345a] bg-[#0a1120] p-2 text-slate-400 transition hover:text-sky-300">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">Cliente cadastrado em {formatDate(tenant.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <TenantStatusBadge status={tenant.status} />
          <EnterClinicButton clinicId={clinic?.id ?? null} disabled={tenant.status !== "ACTIVE" && tenant.status !== "TRIAL"} />
        </div>
      </div>

      {tenant.status === "SUSPENDED" && (
        <div className="anim-fade-up flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200">
          <ShieldAlert className="h-5 w-5" />
          Cliente suspenso. {tenant.blockedReason && <span>Motivo: {tenant.blockedReason}</span>}
        </div>
      )}

      <div className="anim-fade-up grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardBody><p className="text-2xl font-bold text-white">{patientCount}</p><p className="mt-1 text-xs text-slate-500">Pacientes</p></CardBody></Card>
        <Card><CardBody><p className="text-2xl font-bold text-white">{appointmentCount}</p><p className="mt-1 text-xs text-slate-500">Atendimentos</p></CardBody></Card>
        <Card><CardBody><p className="text-2xl font-bold text-white">{clinic?.users.length ?? 0}</p><p className="mt-1 text-xs text-slate-500">Usuários</p></CardBody></Card>
        <Card><CardBody><p className="text-2xl font-bold text-white">{tenant._count.aiInteractions}</p><p className="mt-1 text-xs text-slate-500">Uso da IA</p></CardBody></Card>
      </div>

      <div className="anim-fade-up grid gap-6 lg:grid-cols-2">
        {/* Clínica */}
        <Card>
          <CardHeader title="Clínica" subtitle="Dados cadastrais" action={<Building2 className="h-4 w-4 text-slate-500" />} />
          <CardBody className="space-y-2.5 text-sm">
            {clinic ? (
              <>
                <p><span className="text-slate-500">Nome:</span> <span className="text-slate-200">{clinic.name}</span></p>
                <p><span className="text-slate-500">Responsável:</span> <span className="text-slate-200">{clinic.responsible ?? "—"}</span></p>
                <p><span className="text-slate-500">CRO:</span> <span className="text-slate-200">{clinic.cro ?? "—"}</span></p>
                <p><span className="text-slate-500">Local:</span> <span className="text-slate-200">{clinic.city ? `${clinic.city}${clinic.state ? ` - ${clinic.state}` : ""}` : "—"}</span></p>
                <p><span className="text-slate-500">WhatsApp:</span> <span className="text-slate-200">{clinic.whatsapp ?? "—"}</span></p>
              </>
            ) : (
              <p className="text-slate-500">Nenhuma clínica cadastrada.</p>
            )}
          </CardBody>
        </Card>

        {/* Assinatura atual */}
        <Card>
          <CardHeader title="Assinatura atual" action={<CreditCard className="h-4 w-4 text-slate-500" />} />
          <CardBody>
            {activeSub ? (
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 font-medium">{activeSub.plan?.name ?? "Plano personalizado"}</span>
                  <Badge tone={activeSub.status === "TRIAL" ? "info" : "success"}>
                    {activeSub.status === "TRIAL" ? "Trial" : "Ativa"}
                  </Badge>
                </div>
                <p className="text-slate-500">
                  {formatDate(activeSub.startDate)} → <span className="text-slate-300">{formatDate(activeSub.endDate)}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {activeSub.userLimit} usuário(s) • {activeSub.modules.length} módulo(s) liberado(s)
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeSub.modules.slice(0, 8).map((m) => (
                    <span key={m} className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300">
                      {m}
                    </span>
                  ))}
                  {activeSub.modules.length > 8 && (
                    <span className="rounded-full border border-[#23345a] px-2 py-0.5 text-[10px] text-slate-400">
                      +{activeSub.modules.length - 8}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nenhuma assinatura ativa.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Gestão */}
      <Card className="anim-fade-up">
        <CardHeader title="Gestão do cliente" subtitle="Alterar status, renomear, suspender ou excluir" />
        <CardBody>
          <TenantManage tenant={{ id: tenant.id, name: tenant.name, status: tenant.status }} />
        </CardBody>
      </Card>

      {/* Nova assinatura */}
      <Card className="anim-fade-up">
        <CardHeader title="Nova assinatura" subtitle="Renovar ou trocar o plano deste cliente" />
        <CardBody>
          <SubscriptionForm tenantId={tenant.id} plans={plans.map((p) => ({ id: p.id, name: p.name, price: p.price.toString() }))} />
        </CardBody>
      </Card>

      {/* Usuários */}
      <Card className="anim-fade-up">
        <CardHeader title="Usuários" subtitle={`${clinic?.users.length ?? 0} acesso(s) na conta`} action={<Users className="h-4 w-4 text-slate-500" />} />
        <CardBody>
          <div className="space-y-2.5">
            {clinic?.users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-600/40 to-cyan-500/40 text-sm font-bold text-sky-200">
                    {u.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={u.role === "CLINIC_ADMIN" ? "primary" : "neutral"}>
                    {u.role === "CLINIC_ADMIN" ? "Admin clínica" : u.role}
                  </Badge>
                  <span className="text-[11px] text-slate-600">
                    {u.lastLoginAt ? `Acesso: ${formatDate(u.lastLoginAt, true)}` : "Nunca acessou"}
                  </span>
                </div>
              </div>
            ))}
            {!clinic?.users.length && <p className="text-sm text-slate-500">Nenhum usuário.</p>}
          </div>
        </CardBody>
      </Card>

      {/* Histórico de assinaturas */}
      <Card className="anim-fade-up">
        <CardHeader title="Histórico de assinaturas" action={<History className="h-4 w-4 text-slate-500" />} />
        <CardBody>
          <div className="space-y-2.5">
            {tenant.subscriptions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-200">{s.plan?.name ?? "Personalizado"}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(s.startDate)} → {formatDate(s.endDate)} • renovação #{s.renewals}
                  </p>
                </div>
                <Badge tone={s.status === "ACTIVE" ? "success" : s.status === "TRIAL" ? "info" : "neutral"}>
                  {s.status}
                </Badge>
              </div>
            ))}
            {tenant.subscriptions.length === 0 && <p className="text-sm text-slate-500">Nenhuma assinatura.</p>}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}