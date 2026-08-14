import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx"
import type { ReportData } from "./data"

const PAGE_W = 11906
const PAGE_H = 16838
const MARGIN = 1440
const CONTENT_W = PAGE_W - MARGIN * 2

const TYPE_TITLES: Record<string, string> = {
  production: "Produção do mês",
  finance: "Receita do mês",
  patients: "Pacientes e exames",
}

export async function buildDocx(data: ReportData): Promise<Buffer> {
  const title = TYPE_TITLES[data.type] ?? "Relatório"

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: data.clinicName, bold: true, size: 28, color: "0f172a" })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: title, bold: true, size: 22, color: "475569" }),
        new TextRun({
          text: data.type === "patients" ? " · Lista completa de pacientes" : ` · ${data.monthLabel}`,
          size: 22,
          color: "64748b",
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: `Gerado por ${data.generatedBy} em ${data.generatedAt}`, size: 16, color: "64748b" })],
    }),
  ]

  if (data.production) {
    children.push(
      summaryTable([
        { label: "Registros no mês", value: String(data.production.count) },
        { label: "Total produzido", value: data.production.total },
      ]),
    )

    for (const group of data.production.groups) {
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 40 },
          children: [new TextRun({ text: group.label, bold: true, size: 22, color: "0f172a" })],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `${group.count} registro(s) · Subtotal ${group.total}`, size: 16, color: "64748b" }),
          ],
        }),
        makeTable(
          ["Código", "Data", "Paciente", "Serviço", "Clínica", "Valor", "Status", "Observações"],
          group.rows.map((r) => [r.code, r.date, r.patient, r.service, r.category, r.value, r.status, r.notes]),
          [900, 900, 1800, 1800, 1200, 1000, 800, 626],
        ),
      )
    }

    children.push(
      summaryTable([
        { label: "Total geral", value: data.production.total },
        { label: "Registros", value: String(data.production.count) },
      ]),
    )
  }

  if (data.finance) {
    children.push(
      summaryTable([
        { label: "Entradas", value: data.finance.incomeTotal },
        { label: "Saídas", value: data.finance.expenseTotal },
        { label: "Resultado do mês", value: data.finance.result },
      ]),
    )

    children.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({ text: `Entradas · ${data.finance.entryCount} registro(s)`, bold: true, size: 22, color: "0f172a" }),
        ],
      }),
      makeTable(
        ["Data", "Descrição", "Categoria", "Detalhes", "Valor"],
        data.finance.entries.map((e) => [e.date, e.description, e.category, e.extra, e.value]),
        [900, 3400, 1600, 900, 1226],
      ),
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({ text: `Saídas · ${data.finance.expenseCount} registro(s)`, bold: true, size: 22, color: "0f172a" }),
        ],
      }),
      makeTable(
        ["Vencimento", "Nome", "Categoria", "Status", "Valor"],
        data.finance.expenses.map((e) => [e.date, e.description, e.category, e.extra, e.value]),
        [900, 3400, 1600, 900, 1226],
      ),
    )

    children.push(
      summaryTable([
        { label: "Total de entradas", value: data.finance.incomeTotal },
        { label: "Total de saídas", value: data.finance.expenseTotal },
        { label: "Resultado do mês", value: data.finance.result },
      ]),
    )
  }

  if (data.patients) {
    children.push(
      summaryTable([
        { label: "Pacientes", value: String(data.patients.total) },
        { label: "Com exames registrados", value: String(data.patients.withExams) },
      ]),
    )

    for (const p of data.patients.rows) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 20 },
          children: [
            new TextRun({ text: p.name, bold: true, size: 20, color: "0f172a" }),
            new TextRun({
              text: `  ·  ${p.status}`,
              bold: true,
              size: 16,
              color: p.status === "Ativo" ? "15803d" : "b91c1c",
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: `CPF: ${p.cpf} · Nascimento: ${p.birth} · Sexo: ${p.sex} · Telefone: ${p.phone}`,
              size: 16,
              color: "64748b",
            }),
          ],
        }),
      )

      if (p.exams.length === 0) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: "Nenhum exame registrado.", size: 16, color: "94a3b8" })],
          }),
        )
      } else {
        children.push(
          makeTable(
            ["Tipo", "Data", "Descrição", "Laudo", "Situação"],
            p.exams.map((e) => [e.type, e.date, e.label, e.report, ""]),
            [1500, 1000, 3900, 1400, 1226],
          ),
        )
      }
    }
  }

  if (data.reportFooter) {
    children.push(
      new Paragraph({
        spacing: { before: 200 },
        children: [new TextRun({ text: data.reportFooter, italics: true, size: 16, color: "64748b" })],
      }),
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_W, height: PAGE_H },
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "cbd5e1" } },
                spacing: { after: 80 },
                children: [
                  new TextRun({ text: `${data.clinicName} · ${title}`, size: 16, color: "64748b" }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Página ", size: 16, color: "94a3b8" }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "94a3b8" }),
                  new TextRun({ text: " de ", size: 16, color: "94a3b8" }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "94a3b8" }),
                  new TextRun({ text: `  ·  Gerado em ${data.generatedAt}`, size: 16, color: "94a3b8" }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  })

  return Packer.toBuffer(doc)
}

function summaryTable(items: { label: string; value: string }[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "cbd5e1" }
  const borders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  }
  const width = Math.floor(CONTENT_W / items.length)

  const values = new TableRow({
    children: items.map(
      (i) =>
        new TableCell({
          width: { size: width, type: WidthType.DXA },
          shading: { fill: "f8fafc" },
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: i.value, bold: true, size: 20, color: "0f172a" })],
            }),
          ],
        }),
    ),
  })
  const labels = new TableRow({
    children: items.map(
      (i) =>
        new TableCell({
          width: { size: width, type: WidthType.DXA },
          shading: { fill: "f8fafc" },
          margins: { top: 40, bottom: 80, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: i.label, size: 14, color: "64748b" })],
            }),
          ],
        }),
    ),
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [values, labels],
  })
}

function makeTable(headers: string[], rows: string[][], widths: number[]): Table {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "cbd5e1" }
  const borders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h, i) =>
        new TableCell({
          width: { size: widths[i], type: WidthType.DXA },
          shading: { fill: "e2e8f0" },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 15, color: "334155" })],
            }),
          ],
        }),
    ),
  })

  const bodyRows = rows.map(
    (row, ri) =>
      new TableRow({
        children: row.map(
          (text, ci) =>
            new TableCell({
              width: { size: widths[ci], type: WidthType.DXA },
              shading: ri % 2 === 1 ? { fill: "f8fafc" } : undefined,
              margins: { top: 40, bottom: 40, left: 80, right: 80 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text, size: 16, color: "334155" })],
                }),
              ],
            }),
        ),
      }),
  )

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders,
    rows: [headerRow, ...bodyRows],
  })
}