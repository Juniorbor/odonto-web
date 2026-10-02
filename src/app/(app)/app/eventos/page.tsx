"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Sparkles,
  Plus,
  Search,
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageCircle,
  Eye,
  Filter,
  Layers,
  ChevronRight
} from "lucide-react"

interface EventItem {
  id: string
  code: string
  clientName: string
  clientPhone: string
  eventType: string
  theme: string
  date: string
  time: string
  location: string
  guestsCount: number
  contractedValue: number
  status: "CONFIRMADO" | "RESERVADO" | "PREPARACAO" | "EM_ANDAMENTO" | "FINALIZADO" | "CANCELADO"
  decorSummary: string
  coverImage?: string
}

export default function EventosPage() {
  const [events, setEvents] = useState<EventItem[]>([])

  const [search, setSearch] = useState("")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("TODOS")
  const [modalOpen, setModalOpen] = useState(false)

  // Form State for new Event
  const [formClient, setFormClient] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formType, setFormType] = useState("Festa de 15 Anos")
  const [formTheme, setFormTheme] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formTime, setFormTime] = useState("18:00")
  const [formLocation, setFormLocation] = useState("")
  const [formGuests, setFormGuests] = useState("100")
  const [formValue, setFormValue] = useState("")
  const [formDecor, setFormDecor] = useState("")

  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.clientName.toLowerCase().includes(search.toLowerCase()) ||
      ev.theme.toLowerCase().includes(search.toLowerCase()) ||
      ev.eventType.toLowerCase().includes(search.toLowerCase()) ||
      ev.code.toLowerCase().includes(search.toLowerCase()) ||
      ev.location.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = selectedStatusFilter === "TODOS" || ev.status === selectedStatusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: EventItem["status"]) => {
    switch (status) {
      case "CONFIRMADO":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">✓ CONFIRMADO</span>
      case "PREPARACAO":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">⚙️ EM PREPARAÇÃO</span>
      case "RESERVADO":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-950 dark:text-sky-300">📅 RESERVADO</span>
      case "EM_ANDAMENTO":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-300">🎉 EM MONTAGEM</span>
      case "FINALIZADO":
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-200 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200">✨ FINALIZADO</span>
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-100 text-pink-800">ORÇAMENTO</span>
    }
  }

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formClient || !formDate) return

    const newEv: EventItem = {
      id: `ev-${Date.now()}`,
      code: `EVT-2026-0${events.length + 1}`,
      clientName: formClient,
      clientPhone: formPhone || "(11) 99999-0000",
      eventType: formType,
      theme: formTheme || "Decoração Especial Eliz Decora",
      date: formDate,
      time: formTime,
      location: formLocation || "Local a definir",
      guestsCount: parseInt(formGuests) || 50,
      contractedValue: parseFloat(formValue) || 2500.0,
      status: "RESERVADO",
      decorSummary: formDecor || "Projeto de decoração comercial completo.",
      coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80",
    }

    setEvents([newEv, ...events])
    setModalOpen(false)
    setFormClient("")
    setFormPhone("")
    setFormTheme("")
    setFormDate("")
    setFormLocation("")
    setFormValue("")
    setFormDecor("")
  }

  const totalContractedValue = events.reduce((acc, ev) => acc + ev.contractedValue, 0)
  const totalGuests = events.reduce((acc, ev) => acc + ev.guestsCount, 0)

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-500" />
            Gestão de Eventos & Decorações
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a agenda oficial de montagens, reservas, casamentos e aniversários de 15 anos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/agenda"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] text-xs font-extrabold text-slate-900 dark:text-white hover:bg-[var(--surface-2)] transition-all"
          >
            <Calendar className="w-4 h-4 text-sky-600" />
            Ver na Agenda 3D
          </Link>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Eventos Agendados</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">{events.length} Eventos</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Faturamento Contratado</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">
              R$ {totalContractedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Convidados Atendidos</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">{totalGuests} Pessoas</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Taxa de Confirmação</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">100% Garantido</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar evento, cliente, tema ou local..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-soft)] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-bold">
          {["TODOS", "CONFIRMADO", "PREPARACAO", "RESERVADO"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedStatusFilter === st
                  ? "bg-pink-600 text-white shadow-sm"
                  : "bg-[var(--surface-2)] text-slate-800 dark:text-slate-200 hover:bg-pink-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((ev) => (
          <div
            key={ev.id}
            className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg card-3d space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Event Header */}
              <div className="flex items-start justify-between gap-2 border-b border-[var(--border-soft)] pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-pink-600 block">{ev.code} • {ev.eventType}</span>
                  <h3 className="font-black text-lg text-slate-950 dark:text-white leading-tight">{ev.theme}</h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-bold mt-0.5">👤 Cliente: {ev.clientName}</p>
                </div>
                <div>{getStatusBadge(ev.status)}</div>
              </div>

              {/* Event Metadata Details */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-800 dark:text-slate-200 font-bold bg-[var(--surface-2)]/60 p-3 rounded-2xl border border-[var(--border-soft)]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-500 shrink-0" />
                  <span>{new Date(ev.date).toLocaleDateString("pt-BR")} ({ev.time})</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{ev.guestsCount} Convidados</span>
                </div>

                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">{ev.location}</span>
                </div>
              </div>

              {/* Decoration Summary */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Resumo do Projeto Visual:</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold bg-pink-50/50 dark:bg-slate-800/40 p-3 rounded-xl border border-pink-100 dark:border-slate-700">
                  {ev.decorSummary}
                </p>
              </div>
            </div>

            {/* Event Actions & Total Value */}
            <div className="pt-3 border-t border-[var(--border-soft)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Valor Contratado:</span>
                <span className="text-base font-black text-slate-950 dark:text-white">
                  R$ {ev.contractedValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/55${ev.clientPhone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(ev.clientName)}!%20Estamos%20passando%20para%20confirmar%20os%20detalhes%20da%20sua%20decoração%20'${encodeURIComponent(ev.theme)}'%20agendada%20para%20${ev.date}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                  title="Falar no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                <Link
                  href="/app/projeto-decoracao"
                  className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Projeto 3D</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Evento */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-soft)] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Agendar Novo Evento & Decoração
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={formClient}
                    onChange={(e) => setFormClient(e.target.value)}
                    placeholder="Ex: Mariana & Vítor"
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">WhatsApp de Contato</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 99999-8888"
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Tipo de Evento</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  >
                    <option>Festa de 15 Anos</option>
                    <option>Casamento</option>
                    <option>Festa Infantil</option>
                    <option>Chá Revelação / Bebê</option>
                    <option>Noivado</option>
                    <option>Formatura</option>
                    <option>Evento Corporativo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Tema da Decoração *</label>
                  <input
                    type="text"
                    required
                    value={formTheme}
                    onChange={(e) => setFormTheme(e.target.value)}
                    placeholder="Ex: Borboletas & Tons Pastéis"
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Data do Evento *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Horário</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Nº Convidados</label>
                  <input
                    type="number"
                    value={formGuests}
                    onChange={(e) => setFormGuests(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Local / Salão de Festas</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Buffet Espaço Cristal"
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Valor Contratado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="3500.00"
                    className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300">Resumo dos Itens da Decoração</label>
                <textarea
                  rows={3}
                  value={formDecor}
                  onChange={(e) => setFormDecor(e.target.value)}
                  placeholder="Especifique os painéis, arcos de balões, cilindros e arranjos florais..."
                  className="w-full p-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border-soft)] text-slate-600 hover:bg-[var(--surface-2)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-md font-extrabold"
                >
                  Agendar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
