import { requireSession } from "@/lib/auth"
import { AppShell } from "@/components/layout/app-shell"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSession()
  if (!ctx) redirect("/login")

  return (
    <AppShell
      user={{
        id: ctx.user.id,
        name: ctx.user.name,
        email: ctx.user.email,
        role: ctx.user.role,
        avatarUrl: ctx.user.avatarUrl,
      }}
      modules={ctx.modules}
      isAdminMaster={ctx.isAdminMaster}
      impersonating={ctx.impersonating}
      tenantId={ctx.tenantId}
    >
      {children}
    </AppShell>
  )
}
