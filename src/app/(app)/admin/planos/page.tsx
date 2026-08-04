import Link from "next/link"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { Plus, Pencil, Trash2, Users, HardDrive } from "lucide-react"
import { Card, Badge } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { PlansManager } from "@/components/admin/plans-manager"
import { MODULES } from "@/lib/constants"

export default async function AdminPlansPage() {
  await requireAdminMaster()
  const plans = await prisma.plan.findMany({ where: { isGlobal: true }, orderBy: { price: "asc" } })

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">Planos</h1>
        <p className="mt-1 text-sm text-slate-500">Planos disponíveis para os clientes da plataforma.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="anim-fade-up relative">
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{p.name}</h3>
                <p className="mt-0.5 text-xs text-slate-500">{p.description}</p>
              </div>
              {p.active ? (
                <Badge tone="success">Ativo</Badge>
              ) : (
                <Badge tone="neutral">Inativo</Badge>
              )}
            </div>
            <div className="px-5">
              <span className="text-3xl font-extrabold text-white">{formatCurrency(p.price.toString())}</span>
              <span className="text-sm text-slate-500">/mês</span>
            </div>
            <div className="space-y-2.5 p-5">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Users className="h-3.5 w-3.5" /> Até {p.userLimit} usuário(s)
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <HardDrive className="h-3.5 w-3.5" /> {formatBytes(p.storageLimitBytes)}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {p.modules.map((m) => {
                  const mod = MODULES.find((x) => x.key === m)
                  return mod ? (
                    <span key={m} className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                      {mod.label}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <PlansManager />
    </div>
  )
}

function formatBytes(bytes: bigint) {
  const gb = Number(bytes) / 1073741824
  return gb >= 1 ? `${gb.toFixed(gb >= 10 ? 0 : 1)} GB` : `${Math.round(Number(bytes) / 1048576)} MB`
}