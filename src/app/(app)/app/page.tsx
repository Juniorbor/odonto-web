"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Boxes,
  Calendar,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  PieChart as PieIcon,
  BarChart3,
  Eye,
  Plus
} from "lucide-react"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

export default function Dashboard3DPage() {
  const [metrics, setMetrics] = useState({
    vendasDia: 0.0,
    vendasSemana: 0.0,
    vendasMes: 0.0,
    vendasAno: 0.0,
    recebidos: 0.0,
    pendentes: 0.0,
    orcamentosAbertos: 0,

    totalProdutos: 0,
    disponiveis: 0,
    estoqueBaixo: 0,
    esgotados: 0,
    reservados: 0,

    eventosHoje: 0,
    proximosEventos: 0,
    eventosMes: 0,
    eventosConcluidos: 0,
    eventosCancelados: 0,

    totalClientes: 0,
    novosClientes: 0,
    clientesAtivos: 0,
    clientesRecorrentes: 0
  })

  // Data for Charts
  const salesTrendData: any[] = []
  const topProductsData: any[] = []
  const categoriesData: any[] = []
  const eventsByMonthData: any[] = []

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Banner / Welcome 3D Card */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-sky-600 p-6 sm:p-8 text-white shadow-2xl card-3d">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Painel Interativo Eliz Decora 3D
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Bem-vindo ao Dashboard Principal!
            </h1>
            <p className="text-pink-100 text-xs sm:text-sm max-w-xl">
              Acompanhe o faturamento, controle o acervo de decorações, gerencie orçamentos e acompanhe a agenda de eventos em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app/orcamentos"
              className="px-5 py-3 rounded-2xl bg-white text-pink-600 font-bold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Novo Orçamento
            </Link>
            <Link
              href="/app/decoracoes"
              className="px-5 py-3 rounded-2xl bg-slate-900/40 border border-white/30 text-white font-bold text-xs backdrop-blur-md hover:bg-slate-900/60 transition-all flex items-center gap-2 shrink-0"
            >
              <Eye className="w-4 h-4" />
              Galeria 3D
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 1: RESUMO FINANCEIRO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-pink-500" />
            Resumo Financeiro Comercial
          </h2>
          <span className="text-xs text-slate-500">Atualizado agora</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card Vendas Hoje */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md hover:shadow-xl transition-all card-3d">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Vendas de Hoje</span>
              <span className="p-2.5 rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                R$ {metrics.vendasDia.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+12.4% em relação a ontem</span>
              </div>
            </div>
          </div>

          {/* Card Vendas Mês */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md hover:shadow-xl transition-all card-3d">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Vendas do Mês</span>
              <span className="p-2.5 rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                R$ {metrics.vendasMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Meta mensal 82% atingida</span>
              </div>
            </div>
          </div>

          {/* Card Valores Recebidos */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md hover:shadow-xl transition-all card-3d">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Valores Recebidos</span>
              <span className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                R$ {metrics.recebidos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Entradas & Pagamentos confirmados</div>
            </div>
          </div>

          {/* Card Pendentes / Orçamentos */}
          <div className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md hover:shadow-xl transition-all card-3d">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">A Receber / Em Aberto</span>
              <span className="p-2.5 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                R$ {metrics.pendentes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{metrics.orcamentosAbertos} Orçamentos aguardando aprovação</div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: CHARTS ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Revenue Area Chart (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Evolução Financeira de Vendas</h3>
              <p className="text-xs text-slate-500">Comparativo mensal de vendas vs faturamento efetivado</p>
            </div>
            <span className="ez-badge-magenta px-3 py-1 rounded-full text-xs font-bold">2026</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e1333", borderRadius: "12px", border: "1px solid #ec4899", color: "#fff" }}
                  formatter={(val: any) => [`R$ ${Number(val).toLocaleString("pt-BR")}`, ""]}
                />
                <Area type="monotone" dataKey="vendas" name="Vendas" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
                <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorFaturamento)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Categorias Mais Vendidas</h3>
            <p className="text-xs text-slate-500">Distribuição percentual do acervo contratado</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoriesData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {categoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#1e1333", borderRadius: "10px", color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2">
            {categoriesData.map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{cat.name}: {cat.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 3: ESTOQUE & EVENTOS SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Estoque Status Box */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-sky-500" />
              Controle de Acervo & Estoque
            </h3>
            <Link href="/app/estoque" className="text-xs text-pink-600 font-bold hover:underline">
              Ver Estoque Completo →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-xl font-black text-emerald-600">{metrics.disponiveis} UN</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Estoque Normal</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-xl font-black text-amber-600">{metrics.estoqueBaixo} UN</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Estoque Baixo</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="text-xl font-black text-rose-600">{metrics.esgotados} UN</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Esgotados</div>
            </div>
          </div>
        </div>

        {/* Eventos Status Box */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Status de Eventos & Festas
            </h3>
            <Link href="/app/eventos" className="text-xs text-pink-600 font-bold hover:underline">
              Ver Galeria 3D →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-center">
              <div className="text-xl font-black text-pink-600">{metrics.eventosHoje}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Evento Hoje</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-center">
              <div className="text-xl font-black text-sky-600">{metrics.proximosEventos}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Próximos Eventos</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
              <div className="text-xl font-black text-purple-600">{metrics.eventosMes}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Eventos do Mês</div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 4: TOP PRODUCTS TABLE */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Produtos & Decorações Mais Vendidas
          </h3>
          <Link href="/app/produtos" className="text-xs text-pink-600 font-bold hover:underline">
            Gerenciar Produtos →
          </Link>
        </div>

        <div className="scrollable-table">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-slate-500">
                <th className="py-3 px-4">Item de Decoração</th>
                <th className="py-3 px-4">Quantidade Vendida</th>
                <th className="py-3 px-4">Faturamento Gerado</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {topProductsData.map((prod, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500" />
                    {prod.name}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{prod.quantidade} unidades</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">{prod.val}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link href="/app/produtos" className="text-pink-600 font-semibold hover:underline">
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}