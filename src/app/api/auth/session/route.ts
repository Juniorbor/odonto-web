import { NextResponse } from "next/server"
import { getSessionContext } from "@/lib/auth"

export async function GET() {
  const ctx = await getSessionContext()
  if (!ctx) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      role: ctx.user.role,
    },
    tenantId: ctx.tenantId,
    clinicId: ctx.clinicId,
    modules: ctx.modules,
    isAdminMaster: ctx.isAdminMaster,
  })
}