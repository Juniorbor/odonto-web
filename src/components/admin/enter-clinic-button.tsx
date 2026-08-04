"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toaster"

export function EnterClinicButton({ clinicId, disabled }: { clinicId: string | null; disabled?: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const enter = async () => {
    if (!clinicId || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast(data?.error ?? "Não foi possível entrar.", "error")
        return
      }
      router.push("/app")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={enter}
      disabled={disabled || !clinicId || loading}
      className="gap-1.5"
    >
      <Eye className="h-4 w-4" /> {loading ? "Entrando..." : "Ver como cliente"}
    </Button>
  )
}
