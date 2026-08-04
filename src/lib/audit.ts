import "server-only"
import { prisma } from "@/lib/prisma"

type AuditInput = {
  userId?: string | null
  tenantId?: string | null
  clinicId?: string | null
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
}

export async function logAction(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        tenantId: input.tenantId,
        clinicId: input.clinicId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        details: input.details as never,
        ip: input.ip,
        userAgent: input.userAgent,
      },
    })
  } catch (e) {
    console.error("Audit log error:", e)
  }
}

export async function getClientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null
}
