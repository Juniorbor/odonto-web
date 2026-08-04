import { redirect } from "next/navigation"
import { getSessionContext } from "@/lib/auth"

export async function requireAdminMaster() {
  const ctx = await getSessionContext()
  if (!ctx) redirect("/login")
  if (!ctx.isAdminMaster) redirect("/app")
  return ctx
}