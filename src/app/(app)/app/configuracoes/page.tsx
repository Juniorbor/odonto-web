"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Settings, Save, Upload, Download, RefreshCw, Palette, ShieldCheck, Sun, Moon } from "lucide-react"

export default function ConfiguracoesPage() {
  const [company, setCompany] = useState({
    name: "Eliz Decora Festas",
    slogan: "Transformando momentos especiais em experiências inesquecíveis.",
    cnpj: "12.345.678/0001-99",
    phone: "(11) 98888-7777",
    whatsapp: "(11) 98888-7777",
    email: "contato@elizdecorafestas.com.br",
    address: "Av. das Festas, 1000 - São Paulo, SP",
    primaryColor: "#EC4899",
    secondaryColor: "#0284C7",
    themeMode: "light"
  })

  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleExportBackup = () => {
    const backupData = JSON.stringify({
      company,
      timestamp: new Date().toISOString(),
      version: "2.0"
    }, null, 2)

    const blob = new Blob([backupData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Backup_ElizDecoraFestas_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-pink-500" />
            Configurações do Sistema & Aparência
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalize dados da empresa, logo, cores da marca, backups e notificações.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold animate-fade-in">
          ✓ Configurações salvas com sucesso!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        
        {/* Company Info Box */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-[var(--border-soft)] pb-3">
            Dados da Empresa & Identidade Visual
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-400">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Logo Oficial da Empresa</span>
                <span className="text-[11px] text-slate-500">Exibido na tela inicial, PDF de orçamentos e relatórios</span>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Nome da Empresa</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">CNPJ</label>
              <input
                type="text"
                value={company.cnpj}
                onChange={(e) => setCompany({ ...company, cnpj: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Frase Comercial / Slogan</label>
              <input
                type="text"
                value={company.slogan}
                onChange={(e) => setCompany({ ...company, slogan: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">WhatsApp Comercial</label>
              <input
                type="text"
                value={company.whatsapp}
                onChange={(e) => setCompany({ ...company, whatsapp: e.target.value, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">E-mail Comercial</label>
              <input
                type="email"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block mb-1">Endereço Completo</label>
              <input
                type="text"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
              />
            </div>
          </div>
        </div>

        {/* Backup & Safety Box */}
        <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b border-[var(--border-soft)] pb-3">
            Backup & Segurança dos Dados
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Gerar Backup Completo (.JSON)</span>
              <span className="text-[11px] text-slate-500">Faça o download do arquivo de backup de clientes, estoque e orçamentos.</span>
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Baixar Backup
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações
          </button>
        </div>

      </form>
    </div>
  )
}