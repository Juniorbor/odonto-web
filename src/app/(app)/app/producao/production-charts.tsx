"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  PeriodTabs,
  CountBarChart,
  DonutChart,
  LegendList,
  CARD3D,
} from "@/components/ui/charts"
import { Input } from "@/components/ui/input"
import { monthKey } from "@/lib/utils"

type ProductionStats = {
  group: "day" | "month" | "year"
  series: { label: string; count: number; value: number }[]
  byService: { name: string; count: number; value: number }[]
  byClinic: { name: string; count: number; value: number }[]
}

export function ProductionCharts() {
  const [group, setGroup] = useState<"day" | "month" | "year">("day")
  const now = new Date()
  const [month, setMonth] = useState(monthKey(now))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [data, setData] = useState<ProductionStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const qs = group === "day" ? `group=day&month=${month}` : `group=${group}&year=${year}`
      const res = await fetch(`/api/app/production/stats?${qs}`)
      const json = await res.json()
      if (res.ok) setData(json)
    } finally {
      setLoading(false)
    }
  }, [group, month, year])

  useEffect(() => {
    load()
  }, [load])

  const switchGroup = (g: "day" | "month" | "year") => {
    setLoading(true)
    setGroup(g)
  }
  const switchMonth = (m: string) => {
    setLoading(true)
    setMonth(m)
  }
  const switchYear = (y: string) => {
    setLoading(true)
    setYear(y)
  }

  const hasData = data?.series?.some((s) => s.count > 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodTabs value={group} onChange={switchGroup} />
        {group === "day" ? (
          <Input type="month" value={month} onChange={(e) => switchMonth(e.target.value)} className="w-auto" />
        ) : (
          <Input type="number" value={year} onChange={(e) => switchYear(e.target.value)} min={2020} max={2100} className="w-auto" />
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando indicadores...
        </div>
      ) : !data || !hasData ? (
        <div className="flex items-center justify-center py-10 text-sm text-slate-600">
          Nenhuma produção no período selecionado.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className={CARD3D}>
            <div className="px-4 pb-1.5 pt-3">
              <h3 className="text-sm font-semibold text-slate-100">
                {group === "day"
                  ? "Serviços realizados por dia"
                  : group === "month"
                    ? "Serviços realizados por mês"
                    : "Serviços realizados por ano"}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Quantidade de serviços concluídos no período.</p>
            </div>
            <div className="px-3 pb-3">
              <CountBarChart data={data.series} className="h-44" />
            </div>
          </Card>

          <Card className={CARD3D}>
            <div className="px-4 pb-1.5 pt-3">
              <h3 className="text-sm font-semibold text-slate-100">Serviços mais realizados</h3>
            </div>
            <div className="px-3 pb-3">
              <DonutChart data={data.byService.map((s) => ({ name: s.name, value: s.count }))} className="h-40" />
              <LegendList items={data.byService.map((s) => ({ name: s.name, value: s.count }))} format={visibleCount} />
            </div>
          </Card>

          <Card className={CARD3D}>
            <div className="px-4 pb-1.5 pt-3">
              <h3 className="text-sm font-semibold text-slate-100">Produção por clínica</h3>
            </div>
            <div className="px-3 pb-3">
              <DonutChart data={data.byClinic.map((s) => ({ name: s.name, value: s.count }))} className="h-40" />
              <LegendList items={data.byClinic.map((s) => ({ name: s.name, value: s.count }))} format={visibleCount} />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function visibleCount(v: number) {
  return `${v}`
}