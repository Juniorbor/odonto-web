"use client"

import React, { useState } from "react"
import { Tags, Plus, Search, CheckCircle2, Edit2, Layers, Sparkles } from "lucide-react"

interface CategoryItem {
  id: string
  name: string
  description: string
  itemCount: number
  active: boolean
  color: string
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([])

  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDesc, setNewCategoryDesc] = useState("")

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: newCategoryName,
      description: newCategoryDesc || "Nova categoria de acervo de decoração.",
      itemCount: 0,
      active: true,
      color: "from-pink-500 to-sky-500",
    }

    setCategories([newCat, ...categories])
    setNewCategoryName("")
    setNewCategoryDesc("")
    setModalOpen(false)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tags className="w-6 h-6 text-pink-500" />
            Categorias de Decoração & Acervo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize o catálogo de artigos de festa, móveis, arranjos e estruturas em categorias.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Bar Search & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar categorias..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--surface-2)] border border-[var(--border-soft)] rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Total: <strong className="text-pink-600 font-extrabold">{categories.length}</strong> Categorias</span>
          <span>•</span>
          <span>Acervo Cadastrado: <strong className="text-sky-600 font-extrabold">{categories.reduce((a, b) => a + b.itemCount, 0)}</strong> Itens</span>
        </div>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border-soft)] shadow-lg card-3d space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-r ${cat.color} text-white flex items-center justify-center shadow-md`}>
                  <Layers className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200">
                  {cat.itemCount} Itens no Acervo
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-950 dark:text-white flex items-center gap-1.5">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Ativa no Catálogo
              </span>

              <div className="flex items-center gap-2">
                <button
                  title="Editar Categoria"
                  className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-slate-500 hover:text-pink-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Nova Categoria */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-soft)] rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Cadastrar Nova Categoria
            </h3>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Cilindros & Mesas de Acrílico"
                  className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Descrição Comercial</label>
                <textarea
                  rows={3}
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Descreva o tipo de ornamentação ou peças pertencentes a esta categoria..."
                  className="w-full p-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-2)] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border-soft)] text-xs font-bold text-slate-600 hover:bg-[var(--surface-2)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
