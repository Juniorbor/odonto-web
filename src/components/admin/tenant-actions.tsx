"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Ban, CheckCircle2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toaster"
import { ConfirmDialog } from "@/components/ui/modal"
import { StatusDot } from "@/components/ui/card"

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  TRIAL: "Trial",
  SUSPENDED: "Suspenso",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral" | "info"> = {
  ACTIVE: "success",
  TRIAL: "info",
  SUSPENDED: "warning",
  EXPIRED: "danger",
  CANCELLED: "neutral",
}

export function TenantActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [confirm, setConfirm] = useState<null | "suspend" | "block" | "delete">(null)
  const [loading, setLoading] = useState(false)

  const run = async (action: string, payload?: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload ?? { status: action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Cliente atualizado.", "success")
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar.", "error")
    } finally {
      setLoading(false)
      setConfirm(null)
    }
  }

  const del = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Cliente excluído.", "success")
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error")
    } finally {
      setLoading(false)
      setConfirm(null)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {status === "SUSPENDED" ? (
        <Button size="sm" variant="secondary" loading={loading} onClick={() => run("ACTIVE")}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Ativar
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirm("suspend")}
          className="text-amber-300 hover:bg-amber-500/10"
        >
          <Ban className="h-3.5 w-3.5" /> Suspender
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setConfirm("delete")}
        className="text-rose-300 hover:bg-rose-500/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <ConfirmDialog
        open={confirm === "suspend"}
        onClose={() => setConfirm(null)}
        onConfirm={() => run("SUSPENDED")}
        title="Suspender cliente"
        message="O cliente perderá o acesso à plataforma imediatamente. Continuar?"
        confirmLabel="Suspender"
        loading={loading}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onClose={() => setConfirm(null)}
        onConfirm={del}
        title="Excluir cliente"
        message="Todos os dados deste cliente (pacientes, prontuários, arquivos) serão excluídos permanentemente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir tudo"
        loading={loading}
      />
    </div>
  )
}