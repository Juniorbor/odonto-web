"use client"

import React, { useState } from "react"
import { BarChart3, Download, Printer, Filter, FileSpreadsheet, FileText } from "lucide-react"

export default function RelatoriosPage() {
  const [reportType, setReportType] = useState("Vendas")
  const [period, setPeriod] = useState("Mês Atual")

  const handleExportCSV = () => {
    const csvData = "Tipo;Data;Cliente;Valor\nVenda;19/08/2026;Ana Paula Souza;4600.00\nVenda;18/08/2026;Juliana Santos;3200.00"
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `Relatorio_${reportType}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-pink-500" />
            Central de Relatórios Gerenciais
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gere relatórios completos de vendas, lucro, estoque, eventos e fluxo de caixa com filtros e exportação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Excel / CSV
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-pink-600 text-white font-bold text-xs hover:bg-pink-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Report Selection Filters */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs no-print">
        <div>
          <label className="font-semibold block mb-1">Selecione o Relatório</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
          >
            <option value="Vendas">Relatório de Vendas</option>
            <option value="Faturamento">Relatório de Faturamento & Lucro</option>
            <option value="Estoque">Relatório de Estoque & Movimentações</option>
            <option value="Eventos">Relatório de Eventos Realizados</option>
            <option value="Orçamentos">Relatório de Orçamentos</option>
            <option value="Financeiro">Relatório de Contas a Receber / Pagar</option>
          </select>
        </div>

        <div>
          <label className="font-semibold block mb-1">Período</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
          >
            <option value="Hoje">Hoje</option>
            <option value="Esta Semana">Esta Semana</option>
            <option value="Mês Atual">Mês Atual</option>
            <option value="Ano 2026">Ano 2026</option>
          </select>
        </div>
      </div>

      {/* Printable Report Results */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4 print-area">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">RELATÓRIO DE {reportType.toUpperCase()}</h2>
            <span className="text-xs text-pink-600 font-bold">Período: {period} • Eliz Decora Festas</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">Gerado em: {new Date().toLocaleDateString("pt-BR")}</span>
        </div>

        <div className="scrollable-table">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-slate-500 bg-[var(--surface-2)]">
                <th className="p-3">Ref ID</th>
                <th className="p-3">Data</th>
                <th className="p-3">Descrição / Cliente</th>
                <th className="p-3">Categoria</th>
                <th className="p-3 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              <tr className="hover:bg-[var(--surface-2)]">
                <td className="p-3 font-mono font-bold text-pink-600">VEN-2026-001</td>
                <td className="p-3">19/08/2026</td>
                <td className="p-3 font-bold text-slate-900 dark:text-white">Ana Paula Souza (Festa 15 Anos)</td>
                <td className="p-3">Eventos</td>
                <td className="p-3 text-right font-black text-emerald-600">R$ 4.600,00</td>
              </tr>
              <tr className="hover:bg-[var(--surface-2)]">
                <td className="p-3 font-mono font-bold text-pink-600">VEN-2026-002</td>
                <td className="p-3">18/08/2026</td>
                <td className="p-3 font-bold text-slate-900 dark:text-white">Juliana Santos (Festa Kids)</td>
                <td className="p-3">Aniversário</td>
                <td className="p-3 text-right font-black text-emerald-600">R$ 3.200,00</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}