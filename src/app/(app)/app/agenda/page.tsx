"use client"

import React, { useState } from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, MapPin, Clock, Users, Plus } from "lucide-react"

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<"MES" | "SEMANA" | "DIA">("MES")

  const events: any[] = []

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-pink-500" />
            Agenda Comercial de Eventos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize os compromissos por status de reserva, equipe de montagem e datas festivas.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-2xl border border-[var(--border-soft)]">
          {["MES", "SEMANA", "DIA"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === mode ? "bg-pink-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Color Legend Bar */}
      <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-500">Legenda de Status:</span>
        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">🟡 Orçamento</span>
        <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 font-bold">🔵 Reservado</span>
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">🟢 Confirmado</span>
        <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold">🟣 Em preparação</span>
        <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-bold">🟠 Em andamento</span>
        <span className="px-2.5 py-1 rounded-full bg-slate-800 text-white font-bold">⚫ Finalizado</span>
        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">🔴 Cancelado</span>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md hover:shadow-xl transition-all card-3d space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-black shadow-sm ${evt.colorBadge}`}>
                {evt.statusText}
              </span>
              <span className="text-xs font-bold text-slate-400">📅 {evt.date}</span>
            </div>

            <h3 className="font-bold text-base text-slate-900 dark:text-white">{evt.title}</h3>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div>👤 <strong>Cliente:</strong> {evt.client}</div>
              <div>⏰ <strong>Horário:</strong> {evt.time}</div>
              <div>📍 <strong>Local:</strong> {evt.location}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}