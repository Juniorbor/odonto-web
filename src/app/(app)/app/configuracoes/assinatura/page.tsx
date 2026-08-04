import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { SubscriptionPage } from "./subscription-page"

export default async function ConfigSubscriptionPage() {
  const ctx = await requireSession()

  const [subscription, plan, usage] = await Promise.all([
    ctx.tenantId
      ? prisma.subscription.findFirst({
          where: { tenantId: ctx.tenantId, status: { in: ["ACTIVE", "TRIAL"] } },
          orderBy: { createdAt: "desc" },
        })
      : null,
    ctx.tenantId
      ? prisma.plan.findFirst({ where: { tenantId: ctx.tenantId, name: { not: undefined } } })
      : null,
    ctx.tenantId
      ? prisma.patientImage.count({ where: { clinic: { tenantId: ctx.tenantId } } })
      : 0,
  ])

  return (
    <SubscriptionPage
      subscription={
        subscription
          ? {
              planName: plan?.name ?? ctx.tenantId ? (subscription.modules[0] ? "Personalizado" : "Plano") : "—",
              status: subscription.status,
              userLimit: subscription.userLimit,
              storageLimitBytes: subscription.storageLimitBytes.toString(),
              modules: subscription.modules,
              startDate: subscription.startDate.toISOString(),
              endDate: subscription.endDate.toISOString(),
              renewals: subscription.renewals,
            }
          : null
      }
      fileCountEstimate={usage}
    />
  )
}