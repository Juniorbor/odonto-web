"use client"

import React, { useState } from "react"
import { ArrowUpRight, Plus, AlertOctagon, CheckCircle2 } from "lucide-react"

export default function SaidasPage() {
  const [exits, setExits] = useState<any[]>([])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-rose-500" />
            Saídas de Estoque & Baixas de Acervo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de saídas por Venda, Evento, Perda, Avaria, Uso Interno, Devolução ou Ajuste.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Registros de Saídas & Baixas</h3>

        <div className="scrollable-table">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-slate-500">
                <th className="p-3">Data</th>
                <th className="p-3">Motivo da Saída</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Qtd Baixada</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {exits.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--surface-2)]">
                  <td className="p-3 font-mono text-slate-400">{s.date}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      s.reason.includes("Avaria") ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
                    }`}>
                      {s.reason}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-pink-600">{s.product}</td>
                  <td className="p-3 font-black text-rose-600">-{s.qty} UN</td>
                  <td className="p-3 font-semibold text-slate-700 dark:text-slate-200">{s.user}</td>
                  <td className="p-3 text-slate-500">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
