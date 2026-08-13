import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { readFileBuffer, fileExtensionFromMime } from "@/lib/storage"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId) return NextResponse.json({ error: "Sem clínica." }, { status: 400 })
  if (!hasModule(ctx, "images")) return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })

  const { id } = await params
  const image = await prisma.patientImage.findFirst({ where: { id, clinicId: ctx.clinicId } })
  if (!image) return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 })

  const buffer = await readFileBuffer(image.path)
  if (!buffer) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 })

  const download = req.nextUrl.searchParams.get("download") === "1"
  const ext = fileExtensionFromMime(image.mimeType)
  const filename = `${(image.label || "imagem").replace(/[^\w\d\- ]+/g, "_").trim() || "imagem"}.${ext}`

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=3600",
      ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
    },
  })
}