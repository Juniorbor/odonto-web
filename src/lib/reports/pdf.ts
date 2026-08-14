import path from "path"
import pdfmake from "pdfmake"
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces"
import type { ReportData } from "./data"

const FONT_DIR = path.join(process.cwd(), "src/lib/reports/fonts")

pdfmake.setFonts({
  Roboto: {
    normal: path.join(FONT_DIR, "latin-400-normal.ttf"),
    bold: path.join(FONT_DIR, "latin-700-normal.ttf"),
    italics: path.join(FONT_DIR, "latin-400-italic.ttf"),
    bolditalics: path.join(FONT_DIR, "latin-700-italic.ttf"),
  },
})

const PAGE_MARGINS: [number, number, number, number] = [40, 48, 40, 56]
const CONTENT_WIDTH = 595.28 - 80

const TYPE_TITLES: Record<string, string> = {
  production: "Produção do mês",
  finance: "Receita do mês",
  patients: "Pacientes e exames",
}

const HEADER_BG = "#e2e8f0"
const TOTAL_BG = "#f8fafc"
const ROW_ALT = "#f8fafc"

export async function buildPdf(data: ReportData): Promise<Buffer> {
  const def = buildDocument(data)
  const doc = pdfmake.createPdf(def)
  return doc.getBuffer()
}

function buildDocument(data: ReportData): TDocumentDefinitions {
  const title = TYPE_TITLES[data.type] ?? "Relatório"

  const content: Content[] = [
    {
      table: {
        widths: ["*", "auto"],
        body: [
          [
            { text: data.clinicName, bold: true, fontSize: 14, color: "#0f172a" },
            { text: title, bold: true, fontSize: 11, color: "#475569", alignment: "right" },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 4],
    },
    {
      text: [data.type === "patients" ? "Lista completa de pacientes" : data.monthLabel],
      fontSize: 11,
      color: "#334155",
      margin: [0, 0, 0, 6],
    },
    {
      text: `Gerado por ${data.generatedBy} em ${data.generatedAt}`,
      fontSize: 8,
      color: "#64748b",
      margin: [0, 0, 0, 4],
    },
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1, lineColor: "#cbd5e1" }],
      margin: [0, 0, 0, 10],
    },
  ]

  if (data.production) {
    content.push(
      summaryTable([
        { label: "Registros no mês", value: String(data.production.count) },
        { label: "Total produzido", value: data.production.total },
      ]),
    )

    for (const group of data.production.groups) {
      content.push({
        text: group.label,
        bold: true,
        fontSize: 11,
        margin: [0, 12, 0, 2],
      })
      content.push({
        text: `${group.count} registro(s) · Subtotal ${group.total}`,
        fontSize: 8,
        color: "#64748b",
        margin: [0, 0, 0, 6],
      })
      content.push(
        dataTable(
          [
            { header: "Código", w: 45 },
            { header: "Data", w: 50 },
            { header: "Paciente", w: 100 },
            { header: "Serviço", w: 100 },
            { header: "Clínica", w: 68 },
            { header: "Valor", w: 56, align: "right" },
            { header: "Status", w: 46 },
            { header: "Observações", w: 50 },
          ],
          group.rows.map((r) => [r.code, r.date, r.patient, r.service, r.category, r.value, r.status, r.notes]),
          false,
        ),
      )
    }

    content.push(
      summaryTable([
        { label: "Total geral", value: data.production.total },
        { label: "Registros", value: String(data.production.count) },
      ]),
    )
  }

  if (data.finance) {
    content.push(
      summaryTable([
        { label: "Entradas", value: data.finance.incomeTotal },
        { label: "Saídas", value: data.finance.expenseTotal },
        { label: "Resultado do mês", value: data.finance.result },
      ]),
    )

    content.push({
      text: `Entradas · ${data.finance.entryCount} registro(s)`,
      bold: true,
      fontSize: 11,
      margin: [0, 12, 0, 6],
    })
    content.push(
      dataTable(
        [
          { header: "Data", w: 60 },
          { header: "Descrição", w: 220 },
          { header: "Categoria", w: 100 },
          { header: "Detalhes", w: 60 },
          { header: "Valor", w: 75, align: "right" },
        ],
        data.finance.entries.map((e) => [e.date, e.description, e.category, e.extra, e.value]),
        false,
      ),
    )

    content.push({
      text: `Saídas · ${data.finance.expenseCount} registro(s)`,
      bold: true,
      fontSize: 11,
      margin: [0, 14, 0, 6],
    })
    content.push(
      dataTable(
        [
          { header: "Vencimento", w: 60 },
          { header: "Nome", w: 220 },
          { header: "Categoria", w: 100 },
          { header: "Status", w: 60 },
          { header: "Valor", w: 75, align: "right" },
        ],
        data.finance.expenses.map((e) => [e.date, e.description, e.category, e.extra, e.value]),
        false,
      ),
    )

    content.push(
      summaryTable([
        { label: "Total de entradas", value: data.finance.incomeTotal },
        { label: "Total de saídas", value: data.finance.expenseTotal },
        { label: "Resultado do mês", value: data.finance.result },
      ]),
    )
  }

  if (data.patients) {
    content.push(
      summaryTable([
        { label: "Pacientes", value: String(data.patients.total) },
        { label: "Com exames registrados", value: String(data.patients.withExams) },
      ]),
    )

    for (const p of data.patients.rows) {
      content.push({
        table: {
          widths: ["*", "auto"],
          body: [
            [
              { text: p.name, bold: true, fontSize: 10, color: "#0f172a" },
              { text: p.status, fontSize: 8, color: p.status === "Ativo" ? "#15803d" : "#b91c1c", alignment: "right" },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 10, 0, 0],
      })
      content.push({
        text: `CPF: ${p.cpf} · Nascimento: ${p.birth} · Sexo: ${p.sex} · Telefone: ${p.phone}`,
        fontSize: 8,
        color: "#64748b",
        margin: [0, 1, 0, 4],
      })

      if (p.exams.length === 0) {
        content.push({
          text: "Nenhum exame registrado.",
          fontSize: 8,
          color: "#94a3b8",
          margin: [0, 0, 0, 2],
        })
      } else {
        content.push(
          dataTable(
            [
              { header: "Tipo", w: 90 },
              { header: "Data", w: 60 },
              { header: "Descrição", w: 220 },
              { header: "Laudo", w: 80 },
              { header: "Situação", w: 65 },
            ],
            p.exams.map((e) => [e.type, e.date, e.label, e.report, ""]),
            false,
            true,
          ),
        )
      }
    }
  }

  if (data.reportFooter) {
    content.push({
      text: data.reportFooter,
      fontSize: 8,
      color: "#64748b",
      italics: true,
      margin: [0, 14, 0, 0],
    })
  }

  return {
    pageSize: "A4",
    pageMargins: PAGE_MARGINS,
    defaultStyle: { font: "Roboto", fontSize: 9, color: "#1e293b" },
    header: { text: `${data.clinicName} · ${title}`, fontSize: 7.5, color: "#94a3b8", margin: [40, 20, 40, 0] },
    footer: (currentPage: number, pageCount: number) => ({
      text: `Página ${currentPage} de ${pageCount} · Gerado em ${data.generatedAt}`,
      fontSize: 7.5,
      color: "#94a3b8",
      alignment: "center",
      margin: [40, 0, 40, 20],
    }),
    content,
  }
}

function summaryTable(items: { label: string; value: string }[]): Content {
  return {
    table: {
      widths: items.map(() => "*"),
      body: [
        items.map((i) => ({
          text: i.value,
          bold: true,
          fontSize: 10,
          alignment: "center",
          color: "#0f172a",
        })),
        items.map((i) => ({
          text: i.label,
          fontSize: 7.5,
          alignment: "center",
          color: "#64748b",
        })),
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#cbd5e1",
      vLineColor: () => "#cbd5e1",
      fillColor: () => TOTAL_BG,
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
    margin: [0, 6, 0, 0],
  }
}

function dataTable(
  columns: { header: string; w: number; align?: "left" | "right" | "center" }[],
  rows: string[][],
  altRows = true,
  compact = false,
): Content {
  const body: Content[][] = [
    columns.map((c) => ({
      text: c.header,
      bold: true,
      fontSize: 7.5,
      alignment: c.align ?? "left",
      color: "#334155",
      fillColor: HEADER_BG,
      margin: [3, 3, 3, 3] as [number, number, number, number],
    })),
    ...rows.map((row, ri) =>
      row.map((cellText, ci) => {
        const col = columns[ci]
        return {
          text: cellText,
          fontSize: compact ? 7.5 : 8,
          alignment: col.align ?? "left",
          color: "#334155",
          fillColor: altRows && ri % 2 === 1 ? ROW_ALT : undefined,
          margin: [3, 3, 3, 3] as [number, number, number, number],
        }
      }),
    ),
  ]

  return {
    table: {
      widths: columns.map((c) => c.w),
      body,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#cbd5e1",
      vLineColor: () => "#cbd5e1",
    },
    margin: [0, 2, 0, 2],
  }
}
