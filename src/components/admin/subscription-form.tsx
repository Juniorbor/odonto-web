"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Field, Select } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"

export function SubscriptionForm({ tenantId, plans }: { tenantId: string; plans: { id: string; name: string; price: string }[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          planId: fd.get("planId"),
          status: fd.get("status"),
          startDate: fd.get("startDate") || undefined,
          endDate: fd.get("endDate") || undefined,
          notes: fd.get("notes") || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Assinatura criada com sucesso!", "success")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao criar assinatura.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nova assinatura
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova assinatura" subtitle="Ativação imediata — assinaturas ativas anteriores serão encerradas">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Plano" required>
            <Select name="planId" required>
              <option value="">Selecionar...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — R$ {p.price}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status" required>
            <Select name="status" defaultValue="ACTIVE">
              <option value="ACTIVE">Ativo</option>
              <option value="TRIAL">Trial</option>
              <option value="SUSPENDED">Suspenso</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Início">
              <Input type="date" name="startDate" />
            </Field>
            <Field label="Vencimento">
              <Input type="date" name="endDate" />
            </Field>
          </div>
          <Field label="Observações">
            <Input name="notes" placeholder="Opcional" />
          </Field>
          <Button type="submit" className="w-full" loading={loading}>
            Criar assinatura
          </Button>
        </form>
      </Modal>
    </>
  )
}