"use client"

import Link from "next/link"
import { ArrowLeft, CreditCard, HardDrive, Users2, CalendarClock, Check, Sparkles } from "lucide-react"
import { Card, CardBody, CardHeader, Badge } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/button"
import { formatDate, formatCurrency } from "@/lib/utils"

const STATUS_LABEL: Record<string, { label: string; tone: "info" | "success" | "warning" | "danger" }> = {
  ACTIVE: { label: "Ativa", tone: "success" },
  TRIAL: { label: "Teste gratuito", tone: "info" },
  SUSPENDED: { label: "Suspensa", tone: "danger" },
  EXPIRED: { label: "Expirada", tone: "danger" },
  CANCELLED: { label: "Cancelada", tone: "warning" },
}

const MODULE_LABEL: Record<string, string> = {
  patients: "Pacientes",
  anamnesis: "Anamnese digital",
  appointments: "Atendimentos",
  agenda: "Agenda",
  odontogram: "Odontograma",
  images: "Fotos clínicas",
  radiographs: "Radiografias",
  documents: "Documentos",
  production: "Produção",
  finance: "Financeiro",
  reports: "Relatórios",
  ai: "Assistente IA",
}

export function SubscriptionPage({
  subscription,
  fileCountEstimate,
}: {
  subscription: {
    planName: string
    status: string
    userLimit: number
    storageLimitBytes: string
    modules: string[]
    startDate: string
    endDate: string
    renewals: number
  } | null
  fileCountEstimate: number
}) {
  if (!subscription) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <LinkButton href="/app/configuracoes" variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </LinkButton>
        <p className="mt-6 text-center text-sm text-slate-500">Nenhuma assinatura ativa encontrada para esta conta.</p>
      </div>
    )
  }

  const meta = STATUS_LABEL[subscription.status] ?? { label: subscription.status, tone: "info" as const }
  const storageGB = parseInt(subscription.storageLimitBytes, 10) / 1073741824

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up">
        <LinkButton href="/app/configuracoes" variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </LinkButton>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Minha <span className="text-gradient">assinatura</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Detalhes do plano contratado pela clínica.</p>
      </div>

      <Card className="anim-fade-up">
        <CardBody className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Plano atual</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {subscription.planName} <span className="text-gradient">Odontoweb</span>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                {subscription.renewals > 0 && <span className="text-xs text-slate-500">{subscription.renewals} renovação(ões)</span>}
              </div>
            </div>
            <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-sky-300">{formatCurrency(0)}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Faturamento mensal</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><CalendarClock className="h-3.5 w-3.5" /> Vigência</p>
              <p className="mt-1 text-sm font-medium text-slate-200">
                {formatDate(subscription.startDate)} → {formatDate(subscription.endDate)}
              </p>
            </div>
            <div className="rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><Users2 className="h-3.5 w-3.5" /> Usuários incluídos</p>
              <p className="mt-1 text-sm font-medium text-slate-200">{subscription.userLimit} usuário(s)</p>
            </div>
            <div className="rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><HardDrive className="h-3.5 w-3.5" /> Armazenamento</p>
              <p className="mt-1 text-sm font-medium text-slate-200">{storageGB} GB</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Módulos liberados" subtitle="Recursos incluídos no seu plano." />
        <CardBody>
          {subscription.modules.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum módulo liberado no plano atual.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {subscription.modules.map((m) => (
                <div key={m} className="flex items-center gap-2.5 rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-2.5 text-sm text-slate-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                    <Check className="h-3 w-3" />
                  </span>
                  {MODULE_LABEL[m] ?? m}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardBody>
          <p className="flex items-start gap-3 text-sm text-slate-400">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            Precisa de mais usuários, armazenamento ou módulos? Fale com o suporte em{" "}
            <Link href="mailto:contato@odontoweb.com.br" className="text-sky-400 hover:text-sky-300">
              contato@odontoweb.com.br
            </Link>
            .
          </p>
        </CardBody>
      </Card>
    </div>
  )
}