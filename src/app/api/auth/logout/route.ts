import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSessionUser, logAudit } from "@/lib/auth"

export async function POST() {
  try {
    const user = await getSessionUser()
    if (user) {
      await logAudit(user.id, user.name, "LOGOUT", "Usuário encerrou a sessão com segurança")
    }

    const cookieStore = await cookies()
    cookieStore.delete("eliz_decora_session")

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erro ao efetuar logout" }, { status: 500 })
  }
}