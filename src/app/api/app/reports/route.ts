import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { logAction } from "@/lib/audit"
import { buildReportData, type ReportType } from "@/lib/reports/data"
import { buildPdf } from "@/lib/reports/pdf"
import { buildDocx } from "@/lib/reports/docx"
import { monthKey } from "@/lib/utils"

const TYPE_FILE: Record<ReportType, string> = {
  production: "relatorio_producao",
  finance: "relatorio_receita",
  patients: "relatorio_pacientes",
}

export async function GET(req: NextRequest) {
  const ctx = await requireSession()
  if (!hasModule(ctx, "reports")) {
    return NextResponse.json({ error: "Módulo não disponível." }, { status: 403 })
  }

  const type = req.nextUrl.searchParams.get("type") as ReportType | null
  const format = req.nextUrl.searchParams.get("format")
  const month = req.nextUrl.searchParams.get("month") ?? monthKey(new Date())

  if (!type || !["production", "finance", "patients"].includes(type)) {
    return NextResponse.json({ error: "Tipo de relatório inválido." }, { status: 400 })
  }
  if (!format || !["pdf", "docx"].includes(format)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 })
  }

  try {
    const data = await buildReportData(type, month, {
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      userName: ctx.user.name,
    })

    const buffer = format === "pdf" ? await buildPdf(data) : await buildDocx(data)

    await logAction({
      userId: ctx.user.id,
      tenantId: ctx.tenantId,
      clinicId: ctx.clinicId,
      action: "report_generated",
      entityType: "Report",
      entityId: type,
      details: { format, month, bytes: buffer.length },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    })

    const filename = `${TYPE_FILE[type]}${type === "patients" ? "" : `_${month}`}.${format}`
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    console.error("Report generation error:", e)
    return NextResponse.json({ error: "Erro ao gerar relatório." }, { status: 500 })
  }
}