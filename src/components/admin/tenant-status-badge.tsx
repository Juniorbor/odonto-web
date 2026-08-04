import { Badge } from "@/components/ui/card"

export function TenantStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }> = {
    ACTIVE: { label: "Ativo", tone: "success" },
    TRIAL: { label: "Trial", tone: "info" },
    SUSPENDED: { label: "Suspenso", tone: "warning" },
    EXPIRED: { label: "Expirado", tone: "danger" },
    CANCELLED: { label: "Cancelado", tone: "neutral" },
  }
  const s = map[status] ?? { label: status, tone: "neutral" as const }
  return <Badge tone={s.tone}>{s.label}</Badge>
}