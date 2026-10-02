"use client"

import React, { useState } from "react"
import { Truck, Plus, Phone, Mail, MapPin, Search } from "lucide-react"

export default function FornecedoresPage() {
  const [suppliers] = useState<any[]>([])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-pink-500" />
            Cadastro de Fornecedores
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie parceiros comerciais e fornecedores de insumos para os eventos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {suppliers.map((s) => (
          <div key={s.id} className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md card-3d space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{s.name}</h3>
              <span className="text-[10px] font-mono text-slate-400">CNPJ: {s.cnpj}</span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <div>👤 <strong>Contato:</strong> {s.contact}</div>
              <div>📞 <strong>Telefone:</strong> {s.phone}</div>
              <div>✉️ <strong>E-mail:</strong> {s.email}</div>
              <div className="pt-2 text-pink-600 font-semibold">Insumos: {s.items}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
