import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  let dbConnect = "ok"
  let usersCount = 0

  try {
    usersCount = await prisma.user.count()
  } catch (e: any) {
    dbConnect = `erro: ${e.message}`
  }

  return NextResponse.json({
    status: "online",
    system: "Eliz Decora Festas ERP",
    dbConnect,
    usersCount,
    timestamp: new Date().toISOString(),
  })
}
