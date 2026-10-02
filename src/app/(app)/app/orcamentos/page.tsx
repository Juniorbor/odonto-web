"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import {
  FileText,
  Plus,
  Printer,
  X,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Package,
  Calendar,
  Sparkles,
  ChevronRight,
  MessageCircle,
  Search
} from "lucide-react"

import { partyProductsCatalog } from "@/lib/party-products-catalog"

const ORCAMENTOS_STORAGE_KEY = "eliz_decora_quotes"
const CLIENTS_STORAGE_KEY = "eliz_decora_clients"

export default function OrcamentosPage() {
  const [quotes, setQuotes] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null)
  const [modalNewOpen, setModalNewOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State for New Quote
  const [formClient, setFormClient] = useState("")
  const [formEvent, setFormEvent] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formValidity, setFormValidity] = useState("")
  const [formTransportFee, setFormTransportFee] = useState("300")
  const [formAssemblyFee, setFormAssemblyFee] = useState("300")
  const [formDiscount, setFormDiscount] = useState("0")
  const [selectedProducts, setSelectedProducts] = useState<{ name: string; qty: number; price: number; photo: string }[]>([])
  const [productSearch, setProductSearch] = useState("")

  useEffect(() => {
    try {
      const savedQuotes = localStorage.getItem(ORCAMENTOS_STORAGE_KEY)
      if (savedQuotes) {
        setQuotes(JSON.parse(savedQuotes))
      }

      const savedClients = localStorage.getItem(CLIENTS_STORAGE_KEY)
      if (savedClients) {
        setClients(JSON.parse(savedClients))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const saveQuotesToStorage = (updatedQuotes: any[]) => {
    setQuotes(updatedQuotes)
    try {
      localStorage.setItem(ORCAMENTOS_STORAGE_KEY, JSON.stringify(updatedQuotes))
    } catch (e) {
      console.error(e)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAddProductToQuote = (prod: any) => {
    const existingIndex = selectedProducts.findIndex((p) => p.name === prod.name)
    if (existingIndex >= 0) {
      const updated = [...selectedProducts]
      updated[existingIndex].qty += 1
      setSelectedProducts(updated)
    } else {
      setSelectedProducts([
        ...selectedProducts,
        { name: prod.name, qty: 1, price: prod.sellingPrice, photo: prod.mainPhoto }
      ])
    }
  }

  const handleRemoveProductFromQuote = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index))
  }

  const handleSaveNewQuote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formClient || selectedProducts.length === 0) {
      alert("Por favor, selecione o cliente e ao menos 1 produto para o orçamento.")
      return
    }

    const subtotal = selectedProducts.reduce((acc, item) => acc + item.price * item.qty, 0)
    const transportFee = parseFloat(formTransportFee) || 0
    const assemblyFee = parseFloat(formAssemblyFee) || 0
    const discount = parseFloat(formDiscount) || 0
    const totalValue = subtotal + transportFee + assemblyFee - discount

    const newQuote = {
      id: "q_" + Date.now(),
      code: `ORC-2026-${String(quotes.length + 1).padStart(3, "0")}`,
      client: formClient,
      event: formEvent || "Decoração Especial Eliz Decora",
      date: formDate || new Date().toLocaleDateString("pt-BR"),
      validity: formValidity || "15 dias",
      subtotal,
      servicesFee: 0,
      transportFee,
      laborFee: 0,
      assemblyFee,
      discount,
      totalValue,
      status: "ORCAMENTO",
      items: selectedProducts.map((p) => ({
        name: p.name,
        qty: p.qty,
        price: p.price,
        total: p.price * p.qty,
        photo: p.photo
      }))
    }

    const updated = [newQuote, ...quotes]
    saveQuotesToStorage(updated)
    setModalNewOpen(false)
    resetForm()
    showToast("Orçamento criado e salvo com sucesso!")
  }

  const resetForm = () => {
    setFormClient("")
    setFormEvent("")
    setFormDate("")
    setFormValidity("")
    setFormTransportFee("300")
    setFormAssemblyFee("300")
    setFormDiscount("0")
    setSelectedProducts([])
    setProductSearch("")
  }

  const handlePrintPdf = () => {
    window.print()
  }

  const filteredCatalogForQuote = partyProductsCatalog.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-pink-500" />
            Orçamentos & Propostas Comerciais 3D
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gere orçamentos personalizados, propostas visuais e PDFs para envio direto no WhatsApp ({quotes.length} orçamentos).
          </p>
        </div>

        <button
          onClick={() => {
            resetForm()
            setModalNewOpen(true)
          }}
          className="px-5 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </button>
      </div>

      {/* Quotes List Grid */}
      {quotes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[var(--surface)] border border-dashed border-[var(--border-soft)] space-y-4 no-print">
          <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto font-bold">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Nenhum orçamento emitido ainda</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Clique em "Novo Orçamento" para selecionar um cliente cadastrado e montar uma proposta personalizada.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setModalNewOpen(true)
            }}
            className="px-5 py-2.5 rounded-xl bg-pink-600 text-white font-extrabold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Criar Primeiro Orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
          {quotes.map((q) => (
            <div
              key={q.id}
              className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md hover:shadow-xl transition-all card-3d space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-pink-600 bg-pink-100 dark:bg-pink-950 px-2.5 py-1 rounded-lg">
                    {q.code}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    q.status === "APROVADO" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {q.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{q.client}</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">{q.event}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] space-y-1.5 text-xs font-bold">
                  <div className="flex justify-between text-slate-500">
                    <span>Itens Selecionados:</span>
                    <span>{q.items?.length || 0} produtos</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Frete & Montagem:</span>
                    <span>R$ {((q.transportFee || 0) + (q.assemblyFee || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 dark:text-white pt-1.5 border-t border-[var(--border-soft)] text-sm">
                    <span>Valor Total Final:</span>
                    <span className="text-pink-600">R$ {(q.totalValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-soft)]">
                <span className="text-[10px] text-slate-400 font-bold">Validade: {q.validity}</span>
                <button
                  onClick={() => setSelectedQuote(q)}
                  className="px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs hover:bg-pink-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ver / Gerar PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF PREVIEW / PRINTABLE DOCUMENT MODAL */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-10 space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:m-0">
            
            <div className="flex items-center justify-between border-b pb-4 no-print">
              <span className="font-bold text-sm text-pink-600">Proposta Comercial Eliz Decora Festas</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPdf}
                  className="px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs hover:bg-pink-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button onClick={() => setSelectedQuote(null)} className="p-2 rounded-xl hover:bg-slate-100">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* PRINTABLE PDF CONTENT CONTAINER */}
            <div className="space-y-6 print-area font-sans text-xs">
              <div className="flex items-center justify-between border-b-2 border-pink-500 pb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-400">
                    <Image src="/logo.jpg" alt="Eliz Decora Festas Logo" fill className="object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Eliz Decora Festas</h2>
                    <p className="text-[11px] text-slate-500 font-medium">Decorações Premium & Eventos Inesquecíveis</p>
                    <p className="text-[10px] text-slate-400">CNPJ: 12.345.678/0001-99 • contato@elizdecorafestas.com.br</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-pink-600 block">{selectedQuote.code}</span>
                  <span className="text-[11px] text-slate-500 font-bold block">Emissão: {selectedQuote.date}</span>
                </div>
              </div>

              {/* Client & Event Info */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-pink-50/60 border border-pink-100 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente:</span>
                  <span className="font-black text-slate-900 text-sm block">{selectedQuote.client}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Evento / Tema:</span>
                  <span className="font-extrabold text-slate-900 text-sm block">{selectedQuote.event}</span>
                </div>
              </div>

              {/* Products Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <th className="py-2">Item / Produto</th>
                    <th className="py-2 text-center">Qtd</th>
                    <th className="py-2 text-right">Unitário</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {selectedQuote.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 text-slate-900">{item.name}</td>
                      <td className="py-3 text-center">{item.qty}</td>
                      <td className="py-3 text-right">R$ {Number(item.price).toFixed(2)}</td>
                      <td className="py-3 text-right text-pink-600 font-black">R$ {Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Breakdown */}
              <div className="flex justify-end pt-2">
                <div className="w-72 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-bold">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Produtos:</span>
                    <span>R$ {selectedQuote.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Frete & Montagem:</span>
                    <span>R$ {((selectedQuote.transportFee || 0) + (selectedQuote.assemblyFee || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-slate-900 border-t pt-2 text-sm">
                    <span>VALOR TOTAL FINAL:</span>
                    <span className="text-emerald-600">R$ {selectedQuote.totalValue?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW QUOTE FORM MODAL */}
      {modalNewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[var(--surface)] rounded-3xl border border-[var(--border-soft)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-xs font-bold">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                Criar Novo Orçamento Comercial
              </h2>
              <button onClick={() => setModalNewOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-2)]">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveNewQuote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Selecione o Cliente *</label>
                  {clients.length === 0 ? (
                    <input
                      type="text"
                      required
                      value={formClient}
                      onChange={(e) => setFormClient(e.target.value)}
                      placeholder="Nome do cliente..."
                      className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                    />
                  ) : (
                    <select
                      value={formClient}
                      onChange={(e) => setFormClient(e.target.value)}
                      required
                      className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                    >
                      <option value="">-- Escolha um Cliente Cadastrado --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.fullName}>
                          {c.fullName} ({c.phone})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Nome do Evento / Tema</label>
                  <input
                    type="text"
                    value={formEvent}
                    onChange={(e) => setFormEvent(e.target.value)}
                    placeholder="Ex: Festa 15 Anos - Jardim Encantado"
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Product Selection for Quote */}
              <div className="space-y-2 border-t border-b border-[var(--border-soft)] py-4">
                <span className="text-slate-900 dark:text-white font-black block">Selecione os Produtos do Acervo:</span>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar produto no acervo..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-soft)]"
                  />
                </div>

                {/* Catalog Quick List */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[var(--surface-2)] rounded-xl border border-[var(--border-soft)]">
                  {filteredCatalogForQuote.slice(0, 15).map((p) => (
                    <div key={p.code} className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] hover:bg-pink-50 transition-colors">
                      <span className="truncate max-w-md">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-pink-600 font-black">R$ {p.sellingPrice.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleAddProductToQuote(p)}
                          className="px-2.5 py-1 rounded-md bg-pink-600 text-white font-bold text-[11px] cursor-pointer"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Products in Quote */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs text-slate-500 font-bold block">Itens Adicionados ao Orçamento:</span>
                    <div className="space-y-1">
                      {selectedProducts.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-pink-50/70 border border-pink-100">
                          <span>{p.name} (x{p.qty})</span>
                          <div className="flex items-center gap-3">
                            <span className="text-pink-600 font-black">R$ {(p.price * p.qty).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveProductFromQuote(idx)}
                              className="text-rose-600 hover:text-rose-800"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Frete / Transporte (R$)</label>
                  <input
                    type="number"
                    value={formTransportFee}
                    onChange={(e) => setFormTransportFee(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Taxa de Montagem (R$)</label>
                  <input
                    type="number"
                    value={formAssemblyFee}
                    onChange={(e) => setFormAssemblyFee(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-soft)]">
                <button
                  type="button"
                  onClick={() => setModalNewOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 text-white font-black shadow-md hover:bg-pink-700 cursor-pointer"
                >
                  Gerar Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
