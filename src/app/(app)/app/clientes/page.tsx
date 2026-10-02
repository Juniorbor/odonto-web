"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Camera,
  MessageCircle,
  FileText,
  Sparkles,
  Heart,
  ChevronRight,
  X,
  CheckCircle2,
  Share2,
  Download
} from "lucide-react"

const LOCAL_STORAGE_KEY = "eliz_decora_clients"

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [editingClientIndex, setEditingClientIndex] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    cpfCnpj: "",
    birthDate: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "São Paulo",
    state: "SP",
    cep: "",
    socials: "",
    photoUrl: "",
    observations: "",
  })

  // Event Form State inside Client
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventFormData, setEventFormData] = useState({
    name: "",
    type: "15 Anos",
    date: "",
    time: "19:00",
    location: "",
    theme: "",
    guestsCount: 100,
    contractedValue: 3500.0,
    observations: "",
  })

  // Load clients from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        setClients(JSON.parse(saved))
      }
    } catch (err) {
      console.error("Erro ao carregar clientes do localStorage:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save clients array to localStorage
  const saveClientsToStorage = (updatedClients: any[]) => {
    setClients(updatedClients)
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedClients))
    } catch (err) {
      console.error("Erro ao salvar clientes no localStorage:", err)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleOpenNewModal = () => {
    resetForm()
    setEditingClientIndex(null)
    setModalOpen(true)
  }

  const handleEditClient = (client: any, index: number) => {
    setFormData({
      fullName: client.fullName || "",
      cpfCnpj: client.cpfCnpj || "",
      birthDate: client.birthDate || "",
      phone: client.phone || "",
      whatsapp: client.whatsapp || client.phone || "",
      email: client.email || "",
      address: client.address || "",
      number: client.number || "",
      complement: client.complement || "",
      neighborhood: client.neighborhood || "",
      city: client.city || "São Paulo",
      state: client.state || "SP",
      cep: client.cep || "",
      socials: client.socials || "",
      photoUrl: client.photoUrl || "",
      observations: client.observations || "",
    })
    setEditingClientIndex(index)
    setModalOpen(true)
  }

  const handleDeleteClient = (clientId: string) => {
    if (confirm("Tem certeza que deseja remover este cliente?")) {
      const updated = clients.filter((c) => c.id !== clientId)
      saveClientsToStorage(updated)
      if (selectedClient?.id === clientId) {
        setSelectedClient(null)
      }
      showToast("Cliente removido com sucesso!")
    }
  }

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName) return

    if (editingClientIndex !== null) {
      // Edit existing client
      const updated = [...clients]
      updated[editingClientIndex] = {
        ...updated[editingClientIndex],
        ...formData,
      }
      saveClientsToStorage(updated)
      showToast("Dados do cliente atualizados com sucesso!")
    } else {
      // Create new client
      const newClient = {
        id: "cli_" + Date.now(),
        ...formData,
        totalSpent: 0.0,
        events: [],
        createdAt: new Date().toISOString(),
      }

      const updated = [newClient, ...clients]
      saveClientsToStorage(updated)
      showToast("Novo cliente cadastrado e salvo com sucesso!")
    }

    setModalOpen(false)
    resetForm()
  }

  const handleAddEventToClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !eventFormData.name) return

    const newEvt = {
      id: "evt_" + Date.now(),
      ...eventFormData,
      photos: ["https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80"]
    }

    const updatedClients = clients.map((c) => {
      if (c.id === selectedClient.id) {
        const updatedEvents = [...(c.events || []), newEvt]
        const updatedTotal = (c.totalSpent || 0) + Number(eventFormData.contractedValue || 0)
        return { ...c, events: updatedEvents, totalSpent: updatedTotal }
      }
      return c
    })

    saveClientsToStorage(updatedClients)
    const updatedSelected = updatedClients.find((c) => c.id === selectedClient.id)
    setSelectedClient(updatedSelected)
    setEventModalOpen(false)
    showToast("Evento vinculado ao cliente com sucesso!")
  }

  const resetForm = () => {
    setFormData({
      fullName: "",
      cpfCnpj: "",
      birthDate: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "São Paulo",
      state: "SP",
      cep: "",
      socials: "",
      photoUrl: "",
      observations: "",
    })
  }

  const filteredClients = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cpfCnpj && c.cpfCnpj.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.socials && c.socials.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-500" />
            Cadastro & Gestão de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre, edite e acompanhe o histórico completo de relacionamentos, eventos e contratos ({clients.length} cadastrados).
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-5 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por nome, CPF/CNPJ, telefone ou e-mail..."
          className="w-full pl-11 pr-4 py-3 bg-[var(--surface)] border border-[var(--border-soft)] rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 font-bold"
        />
      </div>

      {/* Empty State when no clients */}
      {clients.length === 0 && !loading && (
        <div className="p-12 text-center rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--border-soft)] space-y-4">
          <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto font-bold">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Nenhum cliente cadastrado</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Clique no botão "Novo Cliente" acima para cadastrar seu primeiro cliente e salvar no sistema.
            </p>
          </div>
          <button
            onClick={handleOpenNewModal}
            className="px-5 py-2.5 rounded-xl bg-pink-600 text-white font-extrabold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Primeiro Cliente
          </button>
        </div>
      )}

      {/* Client List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClients.map((client, idx) => (
          <div
            key={client.id}
            className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md hover:shadow-xl transition-all card-3d space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-pink-100 border-2 border-pink-400 shrink-0">
                    <Image
                      src={client.photoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80"}
                      alt={client.fullName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{client.fullName}</h3>
                    <span className="text-[11px] text-pink-600 font-bold block">{client.socials || "Sem Instagram"}</span>
                    <div className="text-[10px] text-slate-400 font-medium">CPF/CNPJ: {client.cpfCnpj || "Não informado"}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Investido</span>
                  <span className="text-base font-black text-emerald-600">
                    R$ {(client.totalSpent || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Contact Details Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-[var(--border-soft)] font-bold">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span className="truncate">{client.phone || "(Não informado)"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">{client.email || "(Não informado)"}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{client.address ? `${client.address}, ${client.city}` : "São Paulo, SP"}</span>
                </div>
              </div>

              {/* Observations */}
              {client.observations && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-[var(--surface-2)] p-3 rounded-2xl border border-[var(--border-soft)] leading-relaxed italic">
                  "{client.observations}"
                </p>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-[var(--border-soft)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedClient(client)}
                  className="px-3 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Detalhes ({client.events?.length || 0})</span>
                </button>

                {client.phone && (
                  <a
                    href={`https://wa.me/55${client.phone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(client.fullName)}!%20Como%20podemos%20ajudar%20em%20seu%20próximo%20evento?`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                    title="Enviar WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEditClient(client, idx)}
                  className="p-2 rounded-xl bg-[var(--surface-2)] hover:bg-pink-100 text-slate-700 hover:text-pink-600 transition-colors cursor-pointer"
                  title="Editar Cliente"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteClient(client.id)}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                  title="Remover Cliente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CLIENT DETAILED MODAL */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[var(--surface)] rounded-3xl border border-[var(--border-soft)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-pink-100 border border-pink-400">
                  <Image
                    src={selectedClient.photoUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80"}
                    alt={selectedClient.fullName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedClient.fullName}</h2>
                  <span className="text-xs text-pink-600 font-bold">{selectedClient.socials}</span>
                </div>
              </div>

              <button onClick={() => setSelectedClient(null)} className="p-2 rounded-xl hover:bg-[var(--surface-2)] cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Event History Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  Histórico de Eventos & Projetos Contratados
                </h3>

                <button
                  onClick={() => setEventModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vincular Evento</span>
                </button>
              </div>

              {(!selectedClient.events || selectedClient.events.length === 0) ? (
                <div className="p-8 text-center rounded-2xl bg-[var(--surface-2)] border border-dashed border-[var(--border-soft)]">
                  <p className="text-xs text-slate-500 font-bold">Nenhum evento registrado para este cliente ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedClient.events.map((evt: any) => (
                    <div key={evt.id} className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-soft)] space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{evt.name}</h4>
                        <span className="text-xs font-black text-pink-600">R$ {Number(evt.contractedValue).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-4">
                        <span>📅 Data: {evt.date} ({evt.time})</span>
                        <span>📍 Local: {evt.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border-soft)] flex justify-end">
              <button onClick={() => setSelectedClient(null)} className="px-5 py-2.5 rounded-xl bg-slate-200 text-slate-800 font-extrabold text-xs cursor-pointer">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW / EDIT CLIENT FORM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--surface)] rounded-3xl border border-[var(--border-soft)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {editingClientIndex !== null ? "Editar Dados do Cliente" : "Cadastrar Novo Cliente"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-2)]">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-700 dark:text-slate-300">Nome Completo do Cliente *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    placeholder="Ex: Ana Paula Souza"
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp: e.target.value })}
                    placeholder="(11) 99999-8888"
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@gmail.com"
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Rede Social / Instagram</label>
                  <input
                    type="text"
                    value={formData.socials}
                    onChange={(e) => setFormData({ ...formData, socials: e.target.value })}
                    placeholder="@anapauladecor"
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-700 dark:text-slate-300">Endereço Completo</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua das Flores, 123 - São Paulo, SP"
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-700 dark:text-slate-300">Observações / Preferências</label>
                  <textarea
                    rows={2}
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Preferências de tons, estilo de festa, aniversariante VIP..."
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-soft)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-extrabold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black shadow-md cursor-pointer"
                >
                  {editingClientIndex !== null ? "Salvar Alterações" : "Cadastrar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW EVENT FOR CLIENT MODAL */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--surface)] rounded-3xl border border-[var(--border-soft)] shadow-2xl p-6 space-y-4 text-xs font-bold">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Adicionar Evento para {selectedClient?.fullName}</h3>

            <form onSubmit={handleAddEventToClient} className="space-y-3">
              <div>
                <label className="text-slate-700 dark:text-slate-300 block mb-1">Nome do Evento *</label>
                <input
                  type="text"
                  value={eventFormData.name}
                  onChange={(e) => setEventFormData({ ...eventFormData, name: e.target.value })}
                  required
                  placeholder="Ex: Festa de 15 Anos de Sofia"
                  className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Tipo de Evento</label>
                  <select
                    value={eventFormData.type}
                    onChange={(e) => setEventFormData({ ...eventFormData, type: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  >
                    <option value="15 Anos">15 Anos</option>
                    <option value="Casamento">Casamento</option>
                    <option value="Aniversário">Aniversário Infantil</option>
                    <option value="Chá de Bebê">Chá de Bebê / Revelação</option>
                    <option value="Corporativo">Corporativo</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Valor Contratado (R$)</label>
                  <input
                    type="number"
                    value={eventFormData.contractedValue}
                    onChange={(e) => setEventFormData({ ...eventFormData, contractedValue: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-pink-600 font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Data</label>
                  <input
                    type="date"
                    value={eventFormData.date}
                    onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-slate-300 block mb-1">Tema da Decoração</label>
                  <input
                    type="text"
                    value={eventFormData.theme}
                    onChange={(e) => setEventFormData({ ...eventFormData, theme: e.target.value })}
                    placeholder="Ex: Jardim Encantado"
                    className="w-full p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEventModalOpen(false)} className="px-4 py-2.5 rounded-xl border text-slate-600 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-pink-600 text-white font-black shadow-md cursor-pointer">
                  Vincular Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
