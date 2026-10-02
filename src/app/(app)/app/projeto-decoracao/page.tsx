"use client"

import React, { useState } from "react"
import Image from "next/image"
import {
  Sparkles,
  Share2,
  Send,
  Plus,
  Trash2,
  Package,
  Heart,
  CheckCircle2,
  DollarSign,
  Layers,
  FileText,
  Copy,
  Printer
} from "lucide-react"

export default function ProjetoDecoracaoPage() {
  const [clientName, setClientName] = useState("Ana Paula Souza")
  const [eventTheme, setEventTheme] = useState("Jardim Encantado Neon")
  const [eventType, setEventType] = useState("Festa de 15 Anos")
  const [eventDate, setEventDate] = useState("2026-09-10")
  const [eventLocation, setEventLocation] = useState("Buffet Mansão das Rosas - Moema, SP")

  const availableItems = [
    { id: "1", category: "Balões", name: "Kit Arco Desconstruído Premium (Organico)", price: 450.0, photo: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&auto=format&fit=crop&q=80" },
    { id: "2", category: "Painéis", name: "Trio de Painéis Arcos Romanos Sublimados", price: 850.0, photo: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=80" },
    { id: "3", category: "Flores", name: "Arranjo Floral Comunitário de Mesa", price: 280.0, photo: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&auto=format&fit=crop&q=80" },
    { id: "4", category: "Iluminação", name: "Letreiro Neon LED 'Let's Party'", price: 500.0, photo: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80" },
    { id: "5", category: "Mobiliário", name: "Trio de Cilindros MDF Revestidos", price: 350.0, photo: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=400&auto=format&fit=crop&q=80" },
  ]

  const [selectedProjectItems, setSelectedProjectItems] = useState<any[]>([
    { ...availableItems[0], qty: 2 },
    { ...availableItems[1], qty: 1 },
    { ...availableItems[3], qty: 1 },
  ])

  const addItemToProject = (item: any) => {
    const existing = selectedProjectItems.find((i) => i.id === item.id)
    if (existing) {
      setSelectedProjectItems(
        selectedProjectItems.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
      )
    } else {
      setSelectedProjectItems([...selectedProjectItems, { ...item, qty: 1 }])
    }
  }

  const removeItem = (id: string) => {
    setSelectedProjectItems(selectedProjectItems.filter((i) => i.id !== id))
  }

  const totalProjectValue = selectedProjectItems.reduce((acc, i) => acc + i.price * i.qty, 0)

  const handleShareWhatsApp = () => {
    const itemsList = selectedProjectItems
      .map((i) => `• ${i.name} (x${i.qty}) - R$ ${(i.price * i.qty).toFixed(2)}`)
      .join("\n")

    const text = `🎉 *PROJETO DE DECORAÇÃO - ELIZ DECORA FESTAS* 🎉\n\n👤 *Cliente:* ${clientName}\n✨ *Tema:* ${eventTheme} (${eventType})\n📅 *Data:* ${eventDate}\n📍 *Local:* ${eventLocation}\n\n*ITENS SELECIONADOS DO ACERVO:*\n${itemsList}\n\n💰 *VALOR TOTAL DO PROJETO:* R$ ${totalProjectValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n\nFicamos à disposição para aprovar o projeto e garantir a reserva na agenda!`

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-500" />
            Catálogo & Projeto de Decoração Visual
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monte a apresentação do projeto visual de ornamentação para o cliente e compartilhe via WhatsApp.
          </p>
        </div>

        <button
          onClick={handleShareWhatsApp}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          Enviar Projeto pelo WhatsApp
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Controls: Select Items & Details (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-500" />
              1. Dados do Projeto do Cliente
            </h3>

            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Tema da Festas</label>
                  <input
                    type="text"
                    value={eventTheme}
                    onChange={(e) => setEventTheme(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Tipo de Evento</label>
                  <input
                    type="text"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Acervo Catalog Picker */}
          <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-500" />
              2. Adicionar Itens de Acervo ao Projeto
            </h3>

            <div className="space-y-3">
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-2)] flex items-center justify-between gap-3 hover:border-pink-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border">
                      <Image src={item.photo} alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <span className="ez-badge-magenta px-2 py-0.5 rounded-full text-[9px] font-bold">{item.category}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white">{item.name}</h4>
                      <span className="text-emerald-600 font-bold">R$ {item.price.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => addItemToProject(item)}
                    className="p-2 rounded-xl bg-pink-600 text-white font-bold hover:bg-pink-700 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Project Live Visual Mockup Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border-2 border-pink-300 dark:border-pink-900 shadow-2xl space-y-6">
            
            {/* Header Mockup */}
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-pink-400">
                  <Image src="/logo.jpg" alt="Eliz Decora Festas" fill className="object-cover" />
                </div>
                <div>
                  <h2 className="font-black text-lg text-slate-900 dark:text-white">PROJETO DE DECORAÇÃO VISUAL</h2>
                  <span className="text-xs text-pink-600 font-bold">Eliz Decora Festas • Apresentação Oficial</span>
                </div>
              </div>

              <span className="ez-badge-magenta px-3 py-1 rounded-full text-xs font-black">
                {eventType}
              </span>
            </div>

            {/* Client Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-sky-500/10 border border-pink-200 dark:border-pink-900/40 text-xs space-y-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white">Cliente: {clientName}</div>
              <div className="text-slate-600 dark:text-slate-300">Tema: <strong>{eventTheme}</strong></div>
              <div className="text-slate-500">Local: {eventLocation}</div>
            </div>

            {/* Project Image Gallery Grid Mockup */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500">Composição de Fotos da Decoração:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedProjectItems.map((item, i) => (
                  <div key={i} className="relative h-32 rounded-2xl overflow-hidden border border-pink-200 shadow-sm group">
                    <Image src={item.photo} alt={item.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white text-[10px]">
                      <span className="font-bold truncate">{item.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Products Table */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Itens Integrantes do Projeto:</h3>
              <div className="space-y-2">
                {selectedProjectItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                      <span className="text-slate-500 block text-[11px]">{item.qty} unidade(s) x R$ {item.price.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-emerald-600">R$ {(item.price * item.qty).toFixed(2)}</span>
                      <button onClick={() => removeItem(item.id)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Footer */}
            <div className="pt-4 border-t border-[var(--border-soft)] flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Valor Total do Projeto:</span>
              <span className="text-2xl font-black text-emerald-600">
                R$ {totalProjectValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
