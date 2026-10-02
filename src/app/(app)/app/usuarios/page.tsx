"use client"

import React, { useState } from "react"
import { UserCog, Plus, ShieldCheck, Check, Lock, Edit2 } from "lucide-react"

export default function UsuariosPage() {
  const [users, setUsers] = useState([
    { id: "1", name: "Administrador Master", email: "admin@elizdecorafestas.com.br", role: "ADMIN", title: "Administrador Geral", permissions: ["ALL"] },
    { id: "2", name: "Camila Gerente", email: "gerente@elizdecorafestas.com.br", role: "GERENTE", title: "Gerente de Operações", permissions: ["CLIENTES", "PRODUTOS", "ESTOQUE", "VENDAS", "ORCAMENTOS", "EVENTOS", "RELATORIOS"] },
    { id: "3", name: "Mariana Vendas", email: "vendedor@elizdecorafestas.com.br", role: "VENDEDOR", title: "Consultora de Decoração", permissions: ["CLIENTES", "PRODUTOS", "ORCAMENTOS", "VENDAS", "EVENTOS"] },
    { id: "4", name: "Lucas Montador", email: "funcionario@elizdecorafestas.com.br", role: "FUNCIONARIO", title: "Líder de Montagem", permissions: ["EVENTOS", "AGENDA", "ESTOQUE"] }
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-pink-500" />
            Controle de Usuários & Níveis de Acesso
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina papéis (Administrador, Gerente, Funcionário, Vendedor) e permissões individuais por usuário.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map((u) => (
          <div key={u.id} className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">{u.name}</h3>
              <span className="ez-badge-magenta px-2.5 py-0.5 rounded-full text-[10px] font-black">{u.role}</span>
            </div>

            <p className="text-xs text-slate-500">{u.email} • {u.title}</p>

            <div className="pt-2 border-t border-[var(--border-soft)] space-y-1">
              <span className="text-[10px] font-bold text-slate-400 block">Permissões Autorizadas:</span>
              <div className="flex flex-wrap gap-1">
                {u.permissions.map((p, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-[var(--surface-2)] text-[10px] font-semibold text-pink-600">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
