"use client"

import React, { useState, useEffect } from "react"
import {
  ShoppingCart,
  Plus,
  DollarSign,
  CreditCard,
  CheckCircle2,
  Clock,
  Search,
  X,
  Sparkles,
  Trash2,
  UserCheck
} from "lucide-react"

import { partyProductsCatalog } from "@/lib/party-products-catalog"

const SALES_STORAGE_KEY = "eliz_decora_sales"
const CLIENTS_STORAGE_KEY = "eliz_decora_clients"

export default function VendasPage() {
  const [sales, setSales] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Form State for New Sale
  const [formClient, setFormClient] = useState("")
  const [formEvent, setFormEvent] = useState("")
  const [formMethod, setFormMethod] = useState("PIX")
  const [formInstallments, setFormInstallments] = useState("1")
  const [formPaidAmount, setFormPaidAmount] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<{ name: string; qty: number; price: number }[]>([])
  const [productSearch, setProductSearch] = useState("")

  useEffect(() => {
    try {
      const savedSales = localStorage.getItem(SALES_STORAGE_KEY)
      if (savedSales) {
        setSales(JSON.parse(savedSales))
      }

      const savedClients = localStorage.getItem(CLIENTS_STORAGE_KEY)
      if (savedClients) {
        setClients(JSON.parse(savedClients))
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const saveSalesToStorage = (updatedSales: any[]) => {
    setSales(updatedSales)
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(updatedSales))
    } catch (e) {
      console.error(e)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAddProductToSale = (prod: any) => {
    const existingIndex = selectedProducts.findIndex((p) => p.name === prod.name)
    if (existingIndex >= 0) {
      const updated = [...selectedProducts]
      updated[existingIndex].qty += 1
      setSelectedProducts(updated)
    } else {
      setSelectedProducts([
        ...selectedProducts,
        { name: prod.name, qty: 1, price: prod.sellingPrice }
      ])
    }
  }

  const handleRemoveProductFromSale = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index))
  }

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formClient || selectedProducts.length === 0) {
      alert("Por favor, selecione o cliente e adicione pelo menos 1 produto para registrar a venda.")
      return
    }

    const total = selectedProducts.reduce((acc, item) => acc + item.price * item.qty, 0)
    const paid = formPaidAmount !== "" ? parseFloat(formPaidAmount) : total
    const pending = Math.max(0, total - paid)
    const status = pending <= 0 ? "PAGO" : paid > 0 ? "PARCIAL" : "PENDENTE"

    const newSale = {
      id: "v_" + Date.now(),
      code: `VEN-2026-${String(sales.length + 1).padStart(3, "0")}`,
      date: new Date().toLocaleDateString("pt-BR"),
      client: formClient,
      event: formEvent || "Venda Direta / Locação de Acervo",
      method: formMethod,
      installments: parseInt(formInstallments) || 1,
      total,
      paid,
      pending,
      status,
      items: selectedProducts,
    }

    const updated = [newSale, ...sales]
    saveSalesToStorage(updated)
    setModalOpen(false)
    resetForm()
    showToast("Venda registrada e salva com sucesso!")
  }

  const handleDeleteSale = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta venda?")) {
      const updated = sales.filter((s) => s.id !== id)
      saveSalesToStorage(updated)
      showToast("Venda removida com sucesso!")
    }
  }

  const resetForm = () => {
    setFormClient("")
    setFormEvent("")
    setFormMethod("PIX")
    setFormInstallments("1")
    setFormPaidAmount("")
    setSelectedProducts([])
    setProductSearch("")
  }

  const filteredCatalog = partyProductsCatalog.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  )

  const totalSalesValue = sales.reduce((acc, s) => acc + s.total, 0)
  const totalPaidValue = sales.reduce((acc, s) => acc + s.paid, 0)

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-pink-500" />
            Gestão de Vendas & PDV Comercial
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de vendas e locações de acervo vinculadas a clientes ({sales.length} vendas registradas).
          </p>
        </div>

        {/* NOVA VENDA BUTTON */}
        <button
          onClick={() => {
            resetForm()
            setModalOpen(true)
          }}
          className="px-5 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total de Vendas</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">{sales.length} Pedidos</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Valor Faturado</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">
              R$ {totalSalesValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total Recebido</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">
              R$ {totalPaidValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Vendas Realizadas & Pagamentos</h3>
        </div>

        {sales.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-soft)] space-y-3">
            <ShoppingCart className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Nenhuma venda registrada no sistema ainda.</p>
            <button
              onClick={() => {
                resetForm()
                setModalOpen(true)
              }}
              className="px-4 py-2 rounded-xl bg-pink-600 text-white font-bold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Registrar Primeira Venda
            </button>
          </div>
        ) : (
          <div className="scrollable-table">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-soft)] text-slate-500 uppercase text-[10px] font-black">
                  <th className="p-3">Código</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Evento / Descrição</th>
                  <th className="p-3">Forma Pagto</th>
                  <th className="p-3">Valor Total</th>
                  <th className="p-3">Pago / Pendente</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)] font-bold text-slate-900 dark:text-white">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="p-3 font-mono font-bold text-pink-600">{s.code}</td>
                    <td className="p-3 text-slate-500">{s.date}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{s.client}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{s.event}</td>
                    <td className="p-3 text-slate-500">{s.method} ({s.installments}x)</td>
                    <td className="p-3 font-black text-pink-600">R$ {s.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3">
                      <span className="font-bold text-emerald-600 block">R$ {s.paid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      {s.pending > 0 && (
                        <span className="text-amber-600 text-[10px] block">Pend: R$ {s.pending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        s.status === "PAGO" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteSale(s.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Cancelar Venda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW SALE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--surface)] rounded-3xl border border-[var(--border-soft)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-xs font-bold">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-pink-500" />
                Registrar Nova Venda / Pedido Comercial
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-2)]">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveSale} className="space-y-4">
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
                  <label className="text-slate-700 dark:text-slate-300">Descrição / Evento Vinculado</label>
                  <input
                    type="text"
                    value={formEvent}
                    onChange={(e) => setFormEvent(e.target.value)}
                    placeholder="Ex: Venda de acervo para Festa 15 Anos"
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Product Picker */}
              <div className="space-y-2 border-t border-b border-[var(--border-soft)] py-4">
                <span className="text-slate-900 dark:text-white font-black block">Selecione os Produtos da Venda:</span>

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

                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[var(--surface-2)] rounded-xl border border-[var(--border-soft)]">
                  {filteredCatalog.slice(0, 15).map((p) => (
                    <div key={p.code} className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] hover:bg-pink-50 transition-colors">
                      <span className="truncate max-w-md">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-pink-600 font-black">R$ {p.sellingPrice.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleAddProductToSale(p)}
                          className="px-2.5 py-1 rounded-md bg-pink-600 text-white font-bold text-[11px] cursor-pointer"
                        >
                          + Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Products List */}
                {selectedProducts.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs text-slate-500 font-bold block">Itens Selecionados no Pedido:</span>
                    <div className="space-y-1">
                      {selectedProducts.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-pink-50/70 border border-pink-100">
                          <span>{p.name} (x{p.qty})</span>
                          <div className="flex items-center gap-3">
                            <span className="text-pink-600 font-black">R$ {(p.price * p.qty).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveProductFromSale(idx)}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Forma de Pagamento</label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Boleto">Boleto / Faturado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Parcelamento</label>
                  <select
                    value={formInstallments}
                    onChange={(e) => setFormInstallments(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  >
                    <option value="1">À Vista (1x)</option>
                    <option value="2">2x sem juros</option>
                    <option value="3">3x sem juros</option>
                    <option value="6">6x no cartão</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Valor Pago Inicial (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formPaidAmount}
                    onChange={(e) => setFormPaidAmount(e.target.value)}
                    placeholder="Deixe em branco p/ total"
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-soft)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black shadow-md cursor-pointer"
                >
                  Registrar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
