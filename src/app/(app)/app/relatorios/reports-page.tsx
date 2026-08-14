"use client"

import { useState } from "react"
import { CalendarRange, FileDown, FileText, Briefcase, Wallet, Users } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { monthKey } from "@/lib/utils"

type ReportType = "production" | "finance" | "patients"

const REPORTS: {
  type: ReportType
  title: string
  description: string
  icon: React.ReactNode
  filename: (month: string) => string
}[] = [
  {
    type: "production",
    title: "Produção do mês",
    description:
      "Produção de Fernando e Bernardo com todas as informações: código, data, paciente, serviço, clínica, valor, status e observações.",
    icon: <Briefcase className="h-5 w-5" />,
    filename: (m) => `relatorio_producao_${m}`,
  },
  {
    type: "finance",
    title: "Receita do mês",
    description:
      "Todas as entradas e saídas do mês, com categorias, status e o resultado final (receita − despesas).",
    icon: <Wallet className="h-5 w-5" />,
    filename: (m) => `relatorio_receita_${m}`,
  },
  {
    type: "patients",
    title: "Pacientes",
    description:
      "Lista completa de pacientes com os exames realizados (tipo, data, descrição e situação do laudo).",
    icon: <Users className="h-5 w-5" />,
    filename: () => "relatorio_pacientes",
  },
]

export function ReportsPanel() {
  const [month, setMonth] = useState(monthKey(new Date()))
  const [downloading, setDownloading] = useState<string | null>(null)

  const download = async (type: ReportType, format: "pdf" | "docx") => {
    const key = `${type}-${format}`
    setDownloading(key)
    try {
      const rep = REPORTS.find((r) => r.type === type)!
      const url = `/api/app/reports?type=${type}&format=${format}${type === "patients" ? "" : `&month=${month}`}`
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Erro ao gerar o relatório.")
      }
      const blob = await res.blob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${rep.filename(month)}.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Card className="anim-fade-up">
      <CardBody>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">
              Gerar <span className="text-gradient">relatórios</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Escolha o mês e baixe em PDF ou DOCX — pronto para salvar e imprimir (A4, margens configuradas, cabeçalho e
              numeração de páginas).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-slate-500" />
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-auto bg-slate-900/60"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {REPORTS.map((rep) => (
            <Card key={rep.type} className="bg-slate-900/40 transition hover:-translate-y-0.5">
              <CardBody>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400">
                  {rep.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{rep.title}</h3>
                <p className="mt-1.5 min-h-[60px] text-xs leading-relaxed text-slate-500">{rep.description}</p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={downloading === `${rep.type}-pdf`}
                    onClick={() => void download(rep.type, "pdf")}
                  >
                    <FileDown className="h-3.5 w-3.5" /> PDF
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={downloading === `${rep.type}-docx`}
                    onClick={() => void download(rep.type, "docx")}
                  >
                    <FileText className="h-3.5 w-3.5" /> DOCX
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
