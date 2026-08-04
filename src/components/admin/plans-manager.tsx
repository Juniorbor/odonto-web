"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Field, Select } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { MODULES } from "@/lib/constants"

type PlanEditorProps = {
  plan?: {
    id: string
    name: string
    description: string | null
    price: string
    modules: string[]
    userLimit: number
    storageLimitBytes: bigint
    active: boolean
  }
  onDone: () => void
}

function PlanForm({ plan, onDone }: PlanEditorProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modules, setModules] = useState<string[]>(plan?.modules ?? [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    const payload = {
      name: fd.get("name"),
      description: fd.get("description") || undefined,
      price: Number(fd.get("price") || 0),
      modules,
      userLimit: Number(fd.get("userLimit") || 1),
      storageLimitBytes: Number(fd.get("storageGB") || 1) * 1073741824,
      active: fd.get("active") === "on",
    }
    try {
      const res = await fetch(plan ? `/api/admin/plans/${plan.id}` : "/api/admin/plans", {
        method: plan ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast(plan ? "Plano atualizado." : "Plano criado.", "success")
      onDone()
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar plano.", "error")
    } finally {
      setLoading(false)
    }
  }

  const toggle = (key: string) =>
    setModules((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]))

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" required>
          <Input name="name" required defaultValue={plan?.name} placeholder="Ex.: Premium" />
        </Field>
        <Field label="Preço mensal (R$)" required>
          <Input name="price" required type="number" step="0.01" min={0} defaultValue={plan?.price ?? ""} />
        </Field>
        <Field label="Limite de usuários">
          <Input name="userLimit" type="number" min={1} defaultValue={plan?.userLimit ?? 1} />
        </Field>
        <Field label="Armazenamento (GB)">
          <Input
            name="storageGB"
            type="number"
            min={0}
            defaultValue={plan ? (Number(plan.storageLimitBytes) / 1073741824).toFixed(0) : "5"}
          />
        </Field>
        <Field label="Descrição" className="sm:col-span-2">
          <Input name="description" defaultValue={plan?.description ?? ""} placeholder="Breve descrição do plano" />
        </Field>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Módulos liberados</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <label
              key={m.key}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-[#1c2942] bg-[#0a1120] px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={modules.includes(m.key)}
                onChange={() => toggle(m.key)}
                className="h-4 w-4 rounded border-[#23345a] bg-[#0b1120] accent-sky-500"
              />
              <span className="text-sm text-slate-200">{m.label}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-slate-300">
        <input
          type="checkbox"
          name="active"
          defaultChecked={plan?.active ?? true}
          className="h-4 w-4 rounded border-[#23345a] bg-[#0b1120] accent-sky-500"
        />
        Plano ativo para contratação
      </label>

      <Button type="submit" size="lg" className="w-full" loading={loading}>
        {plan ? "Salvar alterações" : "Criar plano"}
      </Button>
    </form>
  )
}

export function PlansManager() {
  const { toast } = useToast()
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const del = async () => {
    if (!deleteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/plans/${deleteId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Plano excluído.", "success")
      setDeleteId(null)
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4" /> Criar novo plano
      </Button>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Criar plano" size="lg">
        <PlanForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={del}
        title="Excluir plano"
        message="Clientes com este plano ativo continuarão com a assinatura atual. Continuar?"
        confirmLabel="Excluir"
        loading={loading}
      />
    </>
  )
}