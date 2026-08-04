import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UsersPage } from "./users-page"

export default async function ConfigUsersPage() {
  const ctx = await requireSession()

  const [users, subscription] = await Promise.all([
    prisma.user.findMany({
      where: { clinicId: ctx.clinicId ?? "none" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        title: true,
        phone: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    ctx.tenantId
      ? prisma.subscription.findFirst({
          where: { tenantId: ctx.tenantId, status: { in: ["ACTIVE", "TRIAL"] } },
          orderBy: { createdAt: "desc" },
          select: { userLimit: true, modules: true },
        })
      : null,
  ])

  return (
    <UsersPage
      users={users.map((u) => ({
        ...u,
        role: (u.role === "ADMIN_MASTER" ? "CLINIC_ADMIN" : u.role) as "CLINIC_ADMIN" | "PROFESSIONAL" | "RECEPTION",
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      }))}
      userLimit={subscription?.userLimit ?? 1}
      canManage={ctx.user.role === "CLINIC_ADMIN"}
    />
  )
}
