"use client"

import React, { useState } from "react"
import Image from "next/image"
import {
  Sparkles,
  Heart,
  Eye,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  Package,
  Layers,
  X,
  Share2,
  Download,
  Star,
  CheckCircle
} from "lucide-react"

export default function Decoracoes3DPage() {
  const [selectedDecor, setSelectedDecor] = useState<any | null>(null)
  const [filterCategory, setFilterCategory] = useState("TODOS")

  const decorItems: any[] = []

  const filteredDecors = decorItems.filter(
    (item) => filterCategory === "TODOS" || item.category === filterCategory
  )

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title & Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-500" />
            Galeria 3D de Decorações & Cenários
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Apresentação extremamente visual com profundidade 3D, acervo completo e detalhes de orçamento.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {["TODOS", "15 ANOS", "CASAMENTO", "ANIVERSÁRIO", "CHÁ REVELAÇÃO"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                filterCategory === cat
                  ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                  : "bg-[var(--surface)] text-slate-600 dark:text-slate-300 border border-[var(--border-soft)] hover:border-pink-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Decor Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {filteredDecors.map((decor) => (
          <div
            key={decor.id}
            onClick={() => setSelectedDecor(decor)}
            className="group relative rounded-3xl overflow-hidden bg-[var(--surface)] border border-[var(--border-soft)] shadow-xl cursor-pointer card-3d"
          >
            {/* Image Container with Hover 3D Shift */}
            <div className="relative h-72 sm:h-80 overflow-hidden">
              <Image
                src={decor.coverImage}
                alt={decor.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              {/* Category Badge Top Left */}
              <div className="absolute top-4 left-4">
                <span className="ez-badge-magenta px-3 py-1 rounded-full text-xs font-black shadow-md">
                  {decor.category}
                </span>
              </div>

              {/* Price Badge Top Right */}
              <div className="absolute top-4 right-4">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-md">
                  R$ {decor.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Card Bottom Overlay Details */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1.5">
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-300">
                  <Star className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
                  {decor.theme}
                </div>
                <h3 className="text-xl font-black">{decor.title}</h3>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-pink-400" />
                    {decor.location}
                  </span>
                  <span className="font-semibold text-sky-300 group-hover:underline flex items-center gap-1">
                    Ver Projeto 3D <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Card Summary Footer */}
            <div className="p-4 bg-[var(--surface-2)] flex items-center justify-between text-xs border-t border-[var(--border-soft)]">
              <div className="text-slate-600 dark:text-slate-300 font-semibold">
                Cliente: <strong className="text-slate-900 dark:text-white">{decor.client}</strong>
              </div>
              <div className="text-slate-400 font-medium">{decor.productsUsed.length} Itens no Acervo</div>
            </div>

          </div>
        ))}
      </div>

      {/* DETAILED DECOR MODAL (3D PROJECT VIEW) */}
      {selectedDecor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[var(--surface)] rounded-3xl border border-[var(--border-soft)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[var(--border-soft)] pb-4">
              <div>
                <span className="ez-badge-magenta px-3 py-1 rounded-full text-xs font-black inline-block mb-1">
                  {selectedDecor.category}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedDecor.title}</h2>
                <p className="text-xs text-pink-600 font-bold mt-0.5">{selectedDecor.theme}</p>
              </div>

              <button onClick={() => setSelectedDecor(null)} className="p-2 rounded-xl hover:bg-[var(--surface-2)]">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Photos Album Showcase */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Álbum Fotográfico da Decoração:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedDecor.photos.map((url: string, idx: number) => (
                  <div key={idx} className="relative h-44 rounded-2xl overflow-hidden border-2 border-pink-200 shadow-md">
                    <Image src={url} alt={selectedDecor.title} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Description & Metadata */}
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] space-y-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">Descrição do Cenário & Conceito:</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{selectedDecor.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-slate-700 dark:text-slate-300 border-t border-[var(--border-soft)]">
                <div>👤 <strong>Cliente:</strong> {selectedDecor.client}</div>
                <div>📅 <strong>Data:</strong> {selectedDecor.date}</div>
                <div>📍 <strong>Local:</strong> {selectedDecor.location}</div>
              </div>
            </div>

            {/* Products Used Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-sky-500" />
                  Produtos & Estruturas Utilizadas neste Projeto
                </h3>
                <span className="text-base font-black text-emerald-600">
                  Valor Total: R$ {selectedDecor.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="scrollable-table border border-[var(--border-soft)] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[var(--surface-2)] text-slate-500">
                    <tr>
                      <th className="p-3">Item de Acervo</th>
                      <th className="p-3">Quantidade</th>
                      <th className="p-3">Unidade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-soft)]">
                    {selectedDecor.productsUsed.map((p: any, i: number) => (
                      <tr key={i}>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="p-3 font-semibold text-pink-600">{p.qty}</td>
                        <td className="p-3 text-slate-500">{p.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-[var(--border-soft)] flex justify-end gap-3">
              <button
                onClick={() => {
                  const message = `Olá! Gostaria de um orçamento semelhante à decoração '${selectedDecor.title}' (Valor: R$ ${selectedDecor.totalValue})`
                  window.open(`https://wa.me/5511988887777?text=${encodeURIComponent(message)}`, "_blank")
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar via WhatsApp
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
