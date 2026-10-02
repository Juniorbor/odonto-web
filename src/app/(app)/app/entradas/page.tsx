"use client"

import React, { useState } from "react"
import { ArrowDownLeft, Plus, CheckCircle2, FileText, Truck, DollarSign } from "lucide-react"

export default function EntradasPage() {
  const [entries, setEntries] = useState<any[]>([])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowDownLeft className="w-6 h-6 text-emerald-500" />
            Entradas de Mercadorias (Notas Fiscais)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ao confirmar uma entrada, o saldo de estoque é atualizado automaticamente.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Notas Fiscais & Entradas Registradas</h3>

        <div className="scrollable-table">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-soft)] text-slate-500">
                <th className="p-3">NF Nº</th>
                <th className="p-3">Data</th>
                <th className="p-3">Fornecedor</th>
                <th className="p-3">Produto Entrado</th>
                <th className="p-3">Qtd</th>
                <th className="p-3">Valor Total</th>
                <th className="p-3">Forma Pagto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-soft)]">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-[var(--surface-2)]">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{e.invoice}</td>
                  <td className="p-3 text-slate-500">{e.date}</td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{e.supplier}</td>
                  <td className="p-3 font-bold text-pink-600">{e.product}</td>
                  <td className="p-3 font-bold text-emerald-600">+{e.qty} UN</td>
                  <td className="p-3 font-black text-slate-900 dark:text-white">R$ {e.total.toFixed(2)}</td>
                  <td className="p-3 text-slate-500">{e.payment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
