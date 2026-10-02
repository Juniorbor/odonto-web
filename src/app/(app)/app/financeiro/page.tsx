"use client"

import React, { useState } from "react"
import { DollarSign, ArrowDownLeft, ArrowUpRight, TrendingUp, CheckCircle2, Clock } from "lucide-react"

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<"RECEBER" | "PAGAR">("RECEBER")

  const accountsReceivable = [
    { id: "f1", client: "Ana Paula Souza", description: "Segunda Parcela Festa 15 Anos Sofia", val: 2300.0, date: "07/09/2026", status: "PENDENTE" },
    { id: "f2", client: "Carlos Eduardo & Beatriz", description: "Sinal de Entrada Casamento Bohô", val: 4250.0, date: "01/09/2026", status: "PENDENTE" },
  ]

  const accountsPayable = [
    { id: "p1", supplier: "Holambra Flores & Arte", description: "NF 4589 - Rosas e Hortênsias", val: 650.0, date: "25/08/2026", status: "PENDENTE" },
    { id: "p2", supplier: "Party Express Distribuidora", description: "NF 5890 - Balões Orgânicos", val: 1200.0, date: "30/08/2026", status: "PENDENTE" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            Módulo Financeiro & Fluxo de Caixa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Contas a receber, contas a pagar, faturamento bruto e conciliação financeira.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-xs font-semibold text-slate-500">Receitas Confirmadas</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">R$ 19.500,00</div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs font-semibold text-slate-500">Contas a Receber (Pendente)</span>
          <div className="text-2xl font-black text-amber-600 mt-1">R$ 6.550,00</div>
        </div>

        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-xs font-semibold text-slate-500">Contas a Pagar (Despesas)</span>
          <div className="text-2xl font-black text-rose-600 mt-1">R$ 1.850,00</div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border-soft)] pb-2">
        <button
          onClick={() => setActiveTab("RECEBER")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "RECEBER" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          Contas a Receber ({accountsReceivable.length})
        </button>
        <button
          onClick={() => setActiveTab("PAGAR")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "PAGAR" ? "bg-rose-600 text-white" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          Contas a Pagar ({accountsPayable.length})
        </button>
      </div>

      {/* Table */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
        <div className="scrollable-table">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-slate-500">
                <th className="p-3">Vencimento</th>
                <th className="p-3">{activeTab === "RECEBER" ? "Cliente" : "Fornecedor"}</th>
                <th className="p-3">Descrição</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {activeTab === "RECEBER"
                ? accountsReceivable.map((r) => (
                    <tr key={r.id} className="hover:bg-[var(--surface-2)]">
                      <td className="p-3 font-mono text-slate-400">{r.date}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{r.client}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{r.description}</td>
                      <td className="p-3 font-black text-emerald-600">R$ {r.val.toFixed(2)}</td>
                      <td className="p-3"><span className="ez-badge-yellow px-2 py-0.5 rounded-full font-bold">{r.status}</span></td>
                    </tr>
                  ))
                : accountsPayable.map((p) => (
                    <tr key={p.id} className="hover:bg-[var(--surface-2)]">
                      <td className="p-3 font-mono text-slate-400">{p.date}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{p.supplier}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{p.description}</td>
                      <td className="p-3 font-black text-rose-600">R$ {p.val.toFixed(2)}</td>
                      <td className="p-3"><span className="ez-badge-yellow px-2 py-0.5 rounded-full font-bold">{p.status}</span></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}