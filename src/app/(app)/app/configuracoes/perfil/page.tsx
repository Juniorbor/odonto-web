import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProfilePage } from "./profile-page"

export default async function ConfigProfilePage() {
  const ctx = await requireSession()

  const user = await prisma.user.findUnique({
    where: { id: ctx.user.id },
    select: { name: true, email: true, phone: true, title: true, avatarUrl: true, role: true, lastLoginAt: true },
  })

  return (
    <ProfilePage
      user={{
        name: user?.name ?? ctx.user.name,
        email: user?.email ?? ctx.user.email,
        phone: user?.phone ?? null,
        title: user?.title ?? null,
        avatarUrl: user?.avatarUrl ?? null,
        role: ctx.user.role,
        lastLoginAt: user?.lastLoginAt?.toISOString() ?? null,
      }}
    />
  )
}