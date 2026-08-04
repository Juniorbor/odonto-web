import Link from "next/link"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Plus, Search, Filter, ArrowRight } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { TenantActions } from "@/components/admin/tenant-actions"
import { TenantStatusBadge } from "@/components/admin/tenant-status-badge"

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdminMaster()
  const { q, status } = await searchParams

  const where: Record<string, unknown> = {}
  if (q) where.name = { contains: q, mode: "insensitive" } as never
  if (status) where.status = status

  const tenants = await prisma.tenant.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { clinics: true, subscriptions: true } },
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
      clinics: { take: 1 },
    },
  })

  const userCounts = await prisma.user.groupBy({ by: ["clinicId"], _count: true })
  const patientCounts = await prisma.patient.groupBy({ by: ["clinicId"], _count: true })

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">Clínicas e consultórios cadastrados na plataforma.</p>
        </div>
        <Link
          href="/admin/clientes/novo"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          <Plus className="h-4 w-4" /> Novo cliente
        </Link>
      </div>

      <form className="anim-fade-up flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome do cliente..."
            className="h-10 w-full rounded-xl border border-[#22335a70] bg-[#0b1120] pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-xl border border-[#22335a70] bg-[#0b1120] px-3 text-sm text-slate-200 [&>option]:bg-[#0b1120]"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="TRIAL">Trial</option>
          <option value="SUSPENDED">Suspensos</option>
          <option value="EXPIRED">Expirados</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#23345a] bg-[#0a1120] px-4 text-sm font-medium text-slate-300 transition hover:border-sky-600/60"
        >
          <Filter className="h-4 w-4" /> Filtrar
        </button>
      </form>

      <Card className="anim-fade-up overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#1c2942] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3.5 font-medium">Cliente</th>
                <th className="px-4 py-3.5 font-medium">Status</th>
                <th className="px-4 py-3.5 font-medium">Plano</th>
                <th className="px-4 py-3.5 font-medium">Usuários</th>
                <th className="px-4 py-3.5 font-medium">Pacientes</th>
                <th className="px-4 py-3.5 font-medium">Vencimento</th>
                <th className="px-4 py-3.5 font-medium">Criado</th>
                <th className="px-4 py-3.5 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131d33]">
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {tenants.map((t) => {
                const clinic = t.clinics[0]
                const userCount =
                  userCounts.filter((u) => u.clinicId === clinic?.id).reduce((a, c) => a + c._count, 0) ?? 0
                const patientCount =
                  patientCounts.filter((p) => p.clinicId === clinic?.id).reduce((a, c) => a + c._count, 0) ?? 0
                const sub = t.subscriptions[0]
                return (
                  <tr key={t.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/clientes/${t.id}`} className="group flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-600/40 to-cyan-500/40 text-sm font-bold text-sky-200">
                          {t.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-100 group-hover:text-sky-300">{t.name}</p>
                          <p className="truncate text-xs text-slate-500">{clinic?.city ? `${clinic.city}${clinic.state ? ` - ${clinic.state}` : ""}` : "—"}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <TenantStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{sub?.plan?.name ?? t.planName ?? "—"}</td>
                    <td className="px-4 py-3.5 text-slate-300">{rc(userCount)}</td>
                    <td className="px-4 py-3.5 text-slate-300">{rc(patientCount)}</td>
                    <td className="px-4 py-3.5 text-slate-400">{formatDate(sub?.endDate)}</td>
                    <td className="px-4 py-3.5 text-slate-500">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <TenantActions id={t.id} status={t.status} />
                        <Link
                          href={`/admin/clientes/${t.id}`}
                          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-sky-300"
                          aria-label="Abrir"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function rc(n: number) {
  return Number(n ?? 0).toLocaleString("pt-BR")
}