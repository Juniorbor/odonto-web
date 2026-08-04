import { NextRequest, NextResponse } from "next/server"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"

const KEYS = ["appName", "logoUrl", "faviconUrl", "primaryColor", "whatsapp", "instagram", "contactEmail", "commercialInfo", "privacyPolicy", "termsOfUse"]

export async function GET() {
  await requireAdminMaster()
  const rows = await prisma.setting.findMany({ where: { key: { in: KEYS } } })
  const settings: Record<string, unknown> = {}
  for (const row of rows) settings[row.key] = row.value
  return NextResponse.json({ settings })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdminMaster()
  const body = await req.json().catch(() => null) as Record<string, unknown> | null
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 })

  const entries = Object.entries(body).filter(([k]) => KEYS.includes(k))
  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    })
  }

  await logAction({
    userId: admin.user.id,
    action: "global_settings_updated",
    details: { keys: entries.map(([k]) => k) } as never,
  })

  return NextResponse.json({ ok: true })
}