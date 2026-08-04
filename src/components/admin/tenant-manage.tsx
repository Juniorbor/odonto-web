"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Power, Pencil, Trash2, Ban, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Field, Textarea } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"

export function TenantManage({ tenant }: { tenant: { id: string; name: string; status: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [showEdit, setShowEdit] = useState(false)
  const [confirm, setConfirm] = useState<null | "suspend" | "activate" | "delete">(null)
  const [loading, setLoading] = useState(false)

  const setStatus = async (status: string, blockedReason?: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, blockedReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Cliente atualizado.", "success")
      setConfirm(null)
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro.", "error")
    } finally {
      setLoading(false)
    }
  }

  const submitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), blockedReason: fd.get("blockedReason") || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Cliente atualizado.", "success")
      setShowEdit(false)
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={() => setShowEdit(!showEdit)}>
        <Pencil className="h-4 w-4" /> Editar nome
      </Button>
      {tenant.status === "SUSPENDED" ? (
        <Button variant="success" onClick={() => setStatus("ACTIVE")}>
          <CheckCircle2 className="h-4 w-4" /> Ativar
        </Button>
      ) : (
        <Button variant="warning" onClick={() => setConfirm("suspend")}>
          <Ban className="h-4 w-4" /> Suspender
        </Button>
      )}
      <Button variant="outline" onClick={() => setConfirm("delete")} className="text-rose-300 hover:text-rose-200">
        <Power className="h-4 w-4" /> Excluir
      </Button>

      {showEdit && (
        <form onSubmit={submitEdit} className="mt-4 w-full rounded-2xl border border-[#1c2942] bg-[#0a1120] p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome">
              <Input name="name" defaultValue={tenant.name} required />
            </Field>
            <Field label="Motivo (suspensão)">
              <Input name="blockedReason" placeholder="Motivo opcional" />
            </Field>
          </div>
          <div className="flex gap-3">
            <Button type="submit" loading={loading}>Salvar</Button>
            <Button type="button" variant="ghost" onClick={() => setShowEdit(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirm === "suspend"}
        onClose={() => setConfirm(null)}
        onConfirm={() => setStatus("SUSPENDED")}
        title="Suspender cliente"
        message="O cliente perderá o acesso imediatamente. Reactivar depois é possível."
        confirmLabel="Suspender"
        loading={loading}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={() => setStatus("CANCELLED")}
        title="Cancelar cliente"
        message="O cliente será cancelado e perderá o acesso. Para excluir definitivamente os dados, use a listagem de clientes."
        confirmLabel="Cancelar"
        loading={loading}
      />
    </div>
  )
}