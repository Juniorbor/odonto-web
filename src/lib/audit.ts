import "server-only"
import { prisma } from "@/lib/prisma"

type AuditInput = {
  userId?: string | null
  userName?: string
  action: string
  details?: string
  device?: string | null
  ip?: string | null
  entityType?: string
  entityId?: string
}

export async function logAction(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userName: input.userName || "Sistema",
        action: input.action,
        details: input.details || (input.entityType ? `${input.entityType}:${input.entityId}` : undefined),
        device: input.device || "Navegador Web",
        ip: input.ip || "127.0.0.1",
      },
    })
  } catch (e) {
    console.error("Audit log error:", e)
  }
}

export async function getClientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1"
}
