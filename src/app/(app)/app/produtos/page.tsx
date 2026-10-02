"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import {
  Package,
  Plus,
  Search,
  Tag,
  Boxes,
  DollarSign,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Filter,
  CheckCircle2,
  Camera,
  List,
  LayoutGrid,
  ArrowUpDown
} from "lucide-react"

import { partyProductsCatalog, PartyProduct } from "@/lib/party-products-catalog"

export default function ProdutosPage() {
  const [products, setProducts] = useState<PartyProduct[]>(partyProductsCatalog)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("TODAS")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table") // Default to Rows/Table view
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState<PartyProduct>({
    code: "",
    sku: "",
    name: "",
    description: "",
    category: "Balões & Arcos",
    subcategory: "Arcos",
    brand: "Eliz Decora",
    unit: "UN",
    costPrice: 0.0,
    sellingPrice: 0.0,
    currentStock: 10,
    minStock: 3,
    maxStock: 50,
    supplierName: "Party Express",
    location: "Prateleira A1",
    mainPhoto: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80",
  })

  useEffect(() => {
    // Keep products strictly sorted alphabetically by name
    const sorted = [...partyProductsCatalog].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    setProducts(sorted)
  }, [])

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    if (editingIndex !== null) {
      const updated = [...products]
      updated[editingIndex] = formData
      updated.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      setProducts(updated)
      setEditingIndex(null)
    } else {
      const newCode = `PROD-${String(products.length + 1).padStart(3, "0")}`
      const newProd = { ...formData, code: formData.code || newCode }
      const updated = [...products, newProd].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      setProducts(updated)
    }

    setModalOpen(false)
    resetForm()
  }

  const handleEditProduct = (index: number) => {
    setEditingIndex(index)
    setFormData(products[index])
    setModalOpen(true)
  }

  const handleDeleteProduct = (code: string) => {
    if (confirm(`Deseja remover o produto ${code} do acervo?`)) {
      setProducts(products.filter((p) => p.code !== code))
    }
  }

  const resetForm = () => {
    setFormData({
      code: "",
      sku: "",
      name: "",
      description: "",
      category: "Balões & Arcos",
      subcategory: "Arcos",
      brand: "Eliz Decora",
      unit: "UN",
      costPrice: 0.0,
      sellingPrice: 0.0,
      currentStock: 10,
      minStock: 3,
      maxStock: 50,
      supplierName: "Party Express",
      location: "Prateleira A1",
      mainPhoto: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80",
    })
    setEditingIndex(null)
  }

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "TODAS" || p.category.toLowerCase().includes(selectedCategory.toLowerCase())
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalStockCount = products.reduce((acc, p) => acc + p.currentStock, 0)
  const categoriesList = [
    "TODAS",
    "Mobiliário & Cenografia",
    "Mesa Posta & Louçaria",
    "Flores, Folhagens & Vasos",
    "Iluminação & Efeitos",
    "Balões & Acessórios",
    "Descartáveis de Luxo & Embalagens",
    "Pista de Dança & Animação",
    "Papelaria & Topos de Bolo",
    "Kits Temáticos & Sazonais"
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-pink-500" />
            Catálogo de Produtos & Acervo (Ordem Alfabética)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie e atualize os preços de locação e venda dos {products.length} itens cadastrados no acervo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Switcher (Tabela em Linhas vs Grade de Cards) */}
          <div className="flex items-center bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border-soft)]">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "table"
                  ? "bg-pink-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Exibir em Linhas (Tabela)"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Visão em Linhas</span>
            </button>

            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "grid"
                  ? "bg-pink-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Exibir em Cards (Grade)"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Visão em Cards</span>
            </button>
          </div>

          <button
            onClick={() => {
              resetForm()
              setModalOpen(true)
            }}
            className="ez-button-primary flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Total de Itens Cadastrados</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">{products.length} Produtos</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Unidades em Estoque</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">{totalStockCount} Unidades</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Ordem de Exibição</div>
            <div className="text-xl font-black text-slate-950 dark:text-white">Alfabética (A-Z)</div>
          </div>
        </div>
      </div>

      {/* Search Bar & Category Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por código, SKU ou nome do produto..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border-soft)] rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-bold">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-pink-600 text-white shadow-sm"
                  : "bg-[var(--surface-2)] text-slate-700 dark:text-slate-300 hover:bg-pink-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW MODE 1: ROWS TABLE VIEW (VISÃO EM LINHAS) */}
      {viewMode === "table" ? (
        <div className="rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-2)] border-b border-[var(--border-soft)] text-slate-500 uppercase text-[10px] font-black tracking-wider">
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4 w-28">Código / SKU</th>
                  <th className="p-4 min-w-[280px]">
                    <div className="flex items-center gap-1 cursor-pointer">
                      <span>Produto & Descrição</span>
                      <ArrowUpDown className="w-3 h-3 text-pink-500" />
                    </div>
                  </th>
                  <th className="p-4 w-40">Categoria</th>
                  <th className="p-4 w-28 text-right">Preço Custo</th>
                  <th className="p-4 w-32 text-right">Preço Venda/Locação</th>
                  <th className="p-4 w-28 text-center">Estoque</th>
                  <th className="p-4 w-28 text-center">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border-soft)] font-bold text-slate-900 dark:text-white">
                {filteredProducts.map((prod, idx) => {
                  const isLowStock = prod.currentStock <= prod.minStock && prod.currentStock > 0
                  const isOutOfStock = prod.currentStock === 0

                  return (
                    <tr
                      key={prod.code}
                      className="hover:bg-pink-50/40 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Index Number */}
                      <td className="p-4 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Code & SKU */}
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-md bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 font-mono text-[11px] font-black block w-fit border border-pink-200 dark:border-slate-700">
                          {prod.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal block mt-0.5">{prod.sku}</span>
                      </td>

                      {/* Product Name, Thumbnail & Spec */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-[var(--border-soft)] shadow-sm">
                            <Image src={prod.mainPhoto} alt={prod.name} fill className="object-cover" />
                          </div>
                          <div>
                            <div className="font-black text-sm text-slate-950 dark:text-white group-hover:text-pink-600 transition-colors">
                              {prod.name}
                            </div>
                            <p className="text-[11px] text-slate-500 font-normal line-clamp-1 max-w-lg mt-0.5">
                              {prod.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Subcategory */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700 block w-fit">
                          {prod.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">{prod.subcategory}</span>
                      </td>

                      {/* Cost Price */}
                      <td className="p-4 text-right text-slate-500 font-semibold">
                        R$ {prod.costPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Selling / Rental Price */}
                      <td className="p-4 text-right font-black text-pink-600 text-sm">
                        R$ {prod.sellingPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="p-4 text-center">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            🔴 Esgotado
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            🟠 {prod.currentStock} {prod.unit}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            🟢 {prod.currentStock} {prod.unit}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditProduct(idx)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-pink-100 text-slate-700 hover:text-pink-600 dark:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Editar Preço e Dados do Produto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod.code)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Remover Produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: GRID CARDS VIEW (VISÃO EM CARDS) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod, idx) => {
            const isLowStock = prod.currentStock <= prod.minStock && prod.currentStock > 0
            const isOutOfStock = prod.currentStock === 0

            return (
              <div
                key={prod.code}
                className="rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-md hover:shadow-xl transition-all card-3d overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <Image src={prod.mainPhoto} alt={prod.name} fill className="object-cover" />

                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-pink-600 text-white shadow-md">
                      {prod.category}
                    </span>

                    <div className="absolute top-3 right-3">
                      {isOutOfStock ? (
                        <span className="bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md">
                          🔴 Esgotado
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md">
                          🟠 Estoque Baixo
                        </span>
                      ) : (
                        <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-md">
                          🟢 {prod.currentStock} {prod.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="text-[10px] font-mono text-slate-400 font-bold">{prod.code} • SKU: {prod.sku}</div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{prod.name}</h3>
                    <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">{prod.description}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-[var(--border-soft)] mt-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Preço de Venda</span>
                    <span className="text-base font-black text-pink-600">
                      R$ {prod.sellingPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleEditProduct(idx)}
                    className="p-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* NEW / EDIT PRODUCT FORM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[var(--surface)] rounded-3xl border border-[var(--border-soft)] shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingIndex !== null ? "Editar Produto & Preços" : "Cadastrar Novo Produto no Acervo"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-2)]">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  >
                    {categoriesList.filter((c) => c !== "TODAS").map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Preço de Custo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Preço de Venda/Locação (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-pink-600 font-black text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">Estoque Atual</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300">Descrição Detalhada do Produto</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border-soft)] text-slate-600 hover:bg-[var(--surface-2)] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-md font-extrabold cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
