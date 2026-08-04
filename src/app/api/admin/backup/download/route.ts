import { NextRequest, NextResponse } from "next/server"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { readFileBuffer, storageRoot } from "@/lib/storage"
import path from "path"
import fs from "fs"

export async function GET(req: NextRequest) {
  await requireAdminMaster()
  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID ausente." }, { status: 400 })

  const record = await prisma.backupRecord.findUnique({ where: { id } })
  if (!record || record.status !== "DONE") {
    return NextResponse.json({ error: "Backup indisponível." }, { status: 404 })
  }

  const abs = path.join(storageRoot(), "backups", record.fileName)
  if (!fs.existsSync(abs)) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 })
  }

  const file = await readFileBuffer(path.join("backups", record.fileName))
  if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 })

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/sql",
      "Content-Disposition": `attachment; filename="${record.fileName}"`,
    },
  })
}