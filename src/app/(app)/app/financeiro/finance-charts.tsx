"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  PeriodTabs,
  FinanceBarsChart,
  DonutChart,
  LegendList,
  CARD3D,
} from "@/components/ui/charts"
import { Input } from "@/components/ui/input"
import { monthKey } from "@/lib/utils"

type FinanceStats = {
  group: "day" | "month" | "year"
  series: { label: string; income: number; expense: number }[]
  incomeByCat: { name: string; value: number }[]
  expenseByCat: { name: string; value: number }[]
}

export function FinanceCharts() {
  const [group, setGroup] = useState<"day" | "month" | "year">("day")
  const now = new Date()
  const [month, setMonth] = useState(monthKey(now))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [data, setData] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const qs = group === "day" ? `group=day&month=${month}` : `group=${group}&year=${year}`
      const res = await fetch(`/api/app/finance/stats?${qs}`)
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

  const hasData = data?.series?.some((s) => s.income > 0 || s.expense > 0)

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
          Nenhum lançamento no período selecionado.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className={CARD3D}>
            <div className="px-4 pb-1.5 pt-3">
              <h3 className="text-sm font-semibold text-slate-100">
                {group === "day"
                  ? "Entradas vs despesas do dia"
                  : group === "month"
                    ? "Entradas vs despesas do ano"
                    : "Entradas vs despesas por ano"}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">Receitas em verde, despesas em vermelho.</p>
            </div>
            <div className="px-3 pb-3">
              <FinanceBarsChart data={data.series} className="h-44" />
            </div>
          </Card>

          <Card className={CARD3D}>
            <div className="px-4 pb-1.5 pt-3">
              <h3 className="text-sm font-semibold text-slate-100">Entradas por categoria</h3>
            </div>
            <div className="px-3 pb-3">
              {data.incomeByCat.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-600">Sem entradas.</p>
              ) : (
                <>
                  <DonutChart data={data.incomeByCat} className="h-40" />
                  <LegendList items={data.incomeByCat} />
                </>
              )}
            </div>
          </Card>

          <Card className={CARD3D}>
            <div className="px-4 pb-1.5 pt-3">
              <h3 className="text-sm font-semibold text-slate-100">Despesas por categoria</h3>
            </div>
            <div className="px-3 pb-3">
              {data.expenseByCat.length === 0 ? (
                <p className="py-6 text-sm text-slate-600">Sem despesas.</p>
              ) : (
                <>
                  <DonutChart data={data.expenseByCat} className="h-40" />
                  <LegendList items={data.expenseByCat} />
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}