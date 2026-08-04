import { NextRequest, NextResponse } from "next/server"
import { requireAdminMaster } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { logAction } from "@/lib/audit"
import crypto from "crypto"

export async function GET() {
  await requireAdminMaster()
  const backups = await prisma.backupRecord.findMany({ orderBy: { startedAt: "desc" }, take: 50 })
  return NextResponse.json({
    backups: backups.map((b) => ({ ...b, sizeBytes: b.sizeBytes.toString() })),
  })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminMaster()
  const body = await req.json().catch(() => null) as { type?: string } | null
  const type = body?.type === "AUTO" ? "AUTO" : "MANUAL"

  const fileName = `backup-${crypto.randomBytes(4).toString("hex")}.sql`
  const record = await prisma.backupRecord.create({
    data: { type, fileName, status: "RUNNING" },
  })

  // Gera o dump via pg_dump quando disponível; caso contrário marca como DONE sem arquivo.
  let sizeBytes = BigInt(0)
  let status = "DONE"
  try {
    const url = new URL(process.env.DATABASE_URL || "")
    const { spawn } = await import("child_process")
    const pgDump = "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe"
    const out = await new Promise<Buffer>((resolve, reject) => {
      const child = spawn(
        pgDump,
        ["--no-owner", "--no-privileges", "--no-comments", `--dbname=${process.env.DATABASE_URL}`],
        { shell: false },
      )
      const chunks: Buffer[] = []
      child.stdout.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
      child.stdout.on("end", () => resolve(Buffer.concat(chunks)))
      child.on("error", reject)
      child.stderr.on("data", () => {})
    })
    sizeBytes = BigInt(out.length)
    if (out.length > 0) {
      const fsp = (await import("fs/promises")).default
      await fsp.mkdir("storage/backups", { recursive: true })
      await fsp.writeFile(`storage/backups/${fileName}`, out)
    }
  } catch {
    status = "NO_DUMP_AVAILABLE"
  }

  await prisma.backupRecord.update({
    where: { id: record.id },
    data: { status, sizeBytes, completedAt: new Date() },
  })

  await logAction({
    userId: admin.user.id,
    action: "backup_generated",
    entityType: "BackupRecord",
    entityId: record.id,
  })

  return NextResponse.json({ ok: true, id: record.id, status })
}