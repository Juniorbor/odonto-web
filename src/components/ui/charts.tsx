"use client"

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Card, CardBody } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"

export type SeriesPoint = { label: string; [k: string]: string | number }
export type DonutDatum = { name: string; value: number }

const COLORS = {
  income: "#34d399",
  expense: "#fb7185",
  primary: "#38bdf8",
  violet: "#a78bfa",
  amber: "#fbbf24",
  cyan: "#22d3ee",
}

export const DONUT_PALETTE = [
  "#38bdf8",
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#818cf8",
  "#e879f9",
  "#4ade80",
  "#f97316",
]

export const CARD3D = "card-3d"

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16)
  const r0 = (n >> 16) & 255
  const g0 = (n >> 8) & 255
  const b0 = n & 255
  const t = amt < 0 ? 0 : 255
  const p = Math.abs(amt)
  const mix = (c: number) => Math.round(c + (t - c) * p)
  const r = mix(r0).toString(16).padStart(2, "0")
  const g = mix(g0).toString(16).padStart(2, "0")
  const b = mix(b0).toString(16).padStart(2, "0")
  return `#${r}${g}${b}`
}

const tooltipStyle = {
  backgroundColor: "#0c1322",
  border: "1px solid #22335a",
  borderRadius: 12,
  boxShadow: "0 12px 40px -8px rgba(14,165,233,.25)",
  fontSize: 12,
}

const axisStyle = { fill: "#5b6b8c", fontSize: 11 }

export function PeriodTabs({
  value,
  onChange,
}: {
  value: "day" | "month" | "year"
  onChange: (v: "day" | "month" | "year") => void
}) {
  const tabs = [
    { key: "day", label: "Por dia" },
    { key: "month", label: "Por mês" },
    { key: "year", label: "Por ano" },
  ] as const
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-[#1c2942] bg-[#0a1424]/80 p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "rounded-lg px-4 py-1.5 text-xs font-semibold transition",
            value === t.key
              ? "bg-sky-500/15 text-sky-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,.35)]"
              : "text-slate-500 hover:text-slate-300",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

const BAR_GRADIENTS = [
  { id: "grad-income", color: COLORS.income },
  { id: "grad-expense", color: COLORS.expense },
  { id: "grad-primary", color: COLORS.primary },
]

function BarGradients() {
  return (
    <defs>
      {BAR_GRADIENTS.map((g) => (
        <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(g.color, 0.45)} />
          <stop offset="100%" stopColor={shade(g.color, -0.3)} />
        </linearGradient>
      ))}
    </defs>
  )
}

export function FinanceBarsChart({
  data,
  className,
}: {
  data: { label: string; income: number; expense: number }[]
  className?: string
}) {
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2942" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#1c2942" }} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
            formatter={(value) => formatCurrency(Number(value))}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <BarGradients />
          <Bar
            dataKey="income"
            name="Entradas"
            fill="url(#grad-income)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            style={{ filter: "drop-shadow(0 8px 6px rgba(2,6,23,.6))" }}
          />
          <Bar
            dataKey="expense"
            name="Despesas"
            fill="url(#grad-expense)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            style={{ filter: "drop-shadow(0 8px 6px rgba(2,6,23,.6))" }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CountBarChart({
  data,
  className,
}: {
  data: { label: string; count: number; value: number }[]
  className?: string
}) {
  return (
    <div className={cn("h-72 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1c2942" vertical={false} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={{ stroke: "#1c2942" }} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(148,163,184,0.06)" }}
            formatter={(value, name) =>
              name === "value" ? formatCurrency(Number(value)) : `${value} serviço(s)`
            }
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <BarGradients />
          <Bar
            dataKey="count"
            name="Serviços"
            fill="url(#grad-primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            style={{ filter: "drop-shadow(0 8px 6px rgba(2,6,23,.6))" }}
          />
          <Bar
            dataKey="value"
            name="Valor (R$)"
            fill={COLORS.income}
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            hide
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DonutChart({
  data,
  className,
}: {
  data: DonutDatum[]
  className?: string
}) {
  return (
    <div className={cn("h-56 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {DONUT_PALETTE.map((c, i) => (
              <linearGradient key={i} id={`donutGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={shade(c, 0.35)} />
                <stop offset="100%" stopColor={shade(c, -0.35)} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="64%"
            outerRadius="92%"
            paddingAngle={2}
            cornerRadius={5}
            stroke="#060d1a"
            strokeWidth={2}
            style={{ filter: "drop-shadow(0 12px 10px rgba(2,6,23,.55))" }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={`url(#donutGrad-${i % DONUT_PALETTE.length})`} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function LegendList({
  items,
  format = formatCurrency,
}: {
  items: DonutDatum[]
  format?: (v: number) => string
}) {
  const total = items.reduce((s, i) => s + i.value, 0)
  return (
    <div className="mt-2 space-y-1">
      {items.map((item, i) => {
        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
        return (
          <div key={`${item.name}-${i}`} className="flex items-center gap-1.5 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: shade(DONUT_PALETTE[i % DONUT_PALETTE.length], 0.1) }}
            />
            <span className="truncate text-slate-300">{item.name}</span>
            <span className="ml-auto pl-2 font-semibold text-slate-500">{pct}%</span>
            <span className="w-16 shrink-0 text-right font-semibold text-slate-200">{format(item.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("anim-fade-up", className)}>
      <CardBody>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </CardBody>
    </Card>
  )
}