import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const ctx = await requireSession()
  const items = await prisma.notification.findMany({
    where: ctx.isAdminMaster ? {} : { userId: ctx.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, type: true, title: true, message: true, link: true, read: true, createdAt: true },
  })
  const unread = await prisma.notification.count({
    where: ctx.isAdminMaster ? {} : { userId: ctx.user.id, read: false },
  })
  return NextResponse.json({
    items: items.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    unread,
  })
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  const body = await req.json().catch(() => null) as { all?: boolean; id?: string } | null
  if (body?.all) {
    await prisma.notification.updateMany({
      where: ctx.isAdminMaster ? {} : { userId: ctx.user.id, read: false },
      data: { read: true },
    })
  } else if (body?.id) {
    await prisma.notification.update({ where: { id: body.id }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}