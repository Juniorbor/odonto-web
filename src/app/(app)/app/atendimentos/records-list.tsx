"use client"

import Link from "next/link"
import { CalendarPlus, ChevronRight, ClipboardList, Search, Stethoscope, UserRound } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/feedback"
import { LinkButton } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

type RecordRow = {
  id: string
  occurredAt: string
  chiefComplaint: string | null
  diagnoses: string | null
  procedures: string | null
  patient: { id: string; fullName: string; phone: string | null }
  user: { name: string } | null
}

export function RecordsList({ records }: { records: RecordRow[] }) {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Atendimentos <span className="text-gradient">e evoluções</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Histórico de atendimentos registrados na clínica.</p>
        </div>
        <LinkButton href="/app/atendimentos/novo">
          <CalendarPlus className="h-4 w-4" /> Novo atendimento
        </LinkButton>
      </div>

      <div className="anim-fade-up flex items-center gap-2 rounded-xl border border-[#1c2942] bg-[#0a1120] px-3.5 py-2.5 sm:max-w-md">
        <Search className="h-4 w-4 shrink-0 text-slate-500" />
        <input
          placeholder="Este módulo mostrará busca em breve..."
          disabled
          className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
        />
      </div>

      <div className="anim-fade-up stagger space-y-3">
        {records.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="file"
                title="Nenhum atendimento registrado"
                description="Registre a primeira evolução clínica de um paciente."
                action={
                  <LinkButton href="/app/atendimentos/novo">
                    <Stethoscope className="h-4 w-4" /> Registrar atendimento
                  </LinkButton>
                }
              />
            </CardBody>
          </Card>
        ) : (
          records.map((r) => (
            <Link key={r.id} href={`/app/pacientes/${r.patient.id}`} className="block transition hover:-translate-y-0.5">
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-xs font-bold text-white">
                      {r.patient.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-100">{r.patient.fullName}</p>
                        <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-300">
                          {formatDate(r.occurredAt, true)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1 text-slate-500"><UserRound className="h-3 w-3" /> {r.chiefComplaint || "Sem queixa registrada"}</span>
                      </p>
                      {r.diagnoses && <p className="mt-0.5 truncate text-xs text-slate-500">Diagnóstico: {r.diagnoses}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {r.user && <span className="text-[11px] text-slate-600">{r.user.name}</span>}
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}