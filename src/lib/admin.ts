import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"

export async function requireAdminMaster() {
  const user = await getSessionUser()
  if (!user) redirect("/login")
  if (user.role !== "ADMIN") redirect("/app")
  return user
}