"use client"

import React, { useState } from "react"
import { Boxes, ArrowDownLeft, ArrowUpRight, AlertTriangle, CheckCircle2, History, Filter, Plus } from "lucide-react"

export default function EstoquePage() {
  const [movements, setMovements] = useState<any[]>([])

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-sky-500" />
            Controle de Estoque & Movimentações
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a disponibilidade real vs reservada e o histórico detalhado de movimentações de acervo.
          </p>
        </div>
      </div>

      {/* Stock Alerts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <span className="text-2xl font-black text-emerald-600 block">🟢 Estoque Normal</span>
          <span className="text-xs text-slate-500">38 Produtos Disponíveis</span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
          <span className="text-2xl font-black text-amber-600 block">🟠 Estoque Baixo</span>
          <span className="text-xs text-slate-500">6 Produtos no Nível Mínimo</span>
        </div>

        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
          <span className="text-2xl font-black text-rose-600 block">🔴 Estoque Esgotado</span>
          <span className="text-xs text-slate-500">4 Produtos Sem Saldo</span>
        </div>
      </div>

      {/* History Log Table */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-pink-500" />
          Histórico de Movimentações Recentes
        </h3>

        <div className="scrollable-table">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-slate-500">
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Qtd</th>
                <th className="p-3">Motivo / Origem</th>
                <th className="p-3">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--surface-2)]">
                  <td className="p-3 font-mono text-slate-400">{m.date}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{m.product}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      m.qty > 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}>
                      {m.type}
                    </span>
                  </td>
                  <td className={`p-3 font-black ${m.qty > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {m.qty > 0 ? `+${m.qty}` : m.qty}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{m.reason}</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{m.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
