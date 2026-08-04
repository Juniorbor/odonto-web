import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Search } from "lucide-react"

export default async function AdminLogsPage({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; page?: string }> }) {
  await requireAdminMaster()
  const { q, action, page } = await searchParams
  const pageNum = Math.max(1, parseInt(page ?? "1") || 1)
  const PAGE_SIZE = 30

  const where: Record<string, unknown> = {}
  if (action) where.action = action

  const logs = await prisma.auditLog.findMany({
    where: where as never,
    orderBy: { createdAt: "desc" },
    skip: (pageNum - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { user: { select: { name: true, email: true } } },
  })

  const total = await prisma.auditLog.count({ where: where as never })

  const actions = await prisma.auditLog.groupBy({ by: ["action"], _count: true, orderBy: { _count: { action: "desc" } }, take: 15 })

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">Registro de auditoria</h1>
        <p className="mt-1 text-sm text-slate-500">{total.toLocaleString("pt-BR")} eventos registrados.</p>
      </div>

      <form className="anim-fade-up flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            name="action"
            defaultValue={action}
            placeholder="Filtrar por ação (ex.: login, tenant_created, patient_created...)"
            className="h-10 w-full rounded-xl border border-[#10a] bg-[#0b1120] pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600"
          />
        </div>
        <button type="submit" className="h-10 rounded-xl border border-[#23345a] bg-[#0a1120] px-4 text-sm text-slate-300">
          Filtrar
        </button>
      </form>

      <Card className="anim-fade-up overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#1c2940] text-[#8ea3bf]">
              <tr>
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Entidade</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#131d33]">
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Nenhum log encontrado.</td></tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="align-top transition hover:bg-white/[0.02]">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-400">{formatDate(l.createdAt, true)}</td>
                  <td className="px-4 py-3 text-slate-300">{l.user?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] text-sky-300">
                      {l.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{l.entityType ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{l.entityId ? l.entityId.slice(-8) : "—"}</td>
                  <td className="max-w-[260px] truncate px-4 py-3 text-slate-500">{JSON.stringify(l.details ?? {})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Página {pageNum} de {Math.ceil(total / PAGE_SIZE)}</p>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <a href={`/admin/logs?${qs({ action: action ?? "", page: String(pageNum - 1) })}`} className="rounded-lg border border-[#23345a] px-3 py-1.5 text-sm text-slate-300">Anterior</a>
            )}
            {pageNum < Math.ceil(total / PAGE_SIZE) && (
              <a href={`/admin/logs?${qs({ action: action ?? "", page: String(pageNum + 1) })}`} className="rounded-lg border border-[#23345a] px-3 py-1.5 text-sm text-slate-300">Próxima</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function qs(params: Record<string, string>) {
  return new URLSearchParams(params).toString()
}