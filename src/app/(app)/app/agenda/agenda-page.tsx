"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Plus,
  Search,
  Stethoscope,
  UserPlus,
  X,
} from "lucide-react"
import { Card, CardBody, Badge } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/feedback"
import { Button, LinkButton } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { Skeleton } from "@/components/ui/feedback"
import { formatDate, todayInput } from "@/lib/utils"

type AgendaPatient = { id: string; fullName: string; phone: string | null }
type AgendaProfessional = { id: string; fullName: string; cro: string | null; specialty: string | null }

type AppointmentRow = {
  id: string
  startsAt: string
  endsAt: string | null
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
  type: string | null
  notes: string | null
  patient: { id: string; fullName: string; phone: string | null }
  user: { id: string; name: string } | null
}

const STATUS_META: Record<string, { label: string; tone: "info" | "success" | "warning" | "danger" }> = {
  SCHEDULED: { label: "Agendado", tone: "info" },
  CONFIRMED: { label: "Confirmado", tone: "success" },
  IN_PROGRESS: { label: "Em atendimento", tone: "warning" },
  COMPLETED: { label: "Concluído", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  NO_SHOW: { label: "Faltou", tone: "danger" },
}

export function AgendaPage({
  patients: initialPatients,
  professionals,
}: {
  patients: AgendaPatient[]
  professionals: AgendaProfessional[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [day, setDay] = useState(todayInput())
  const [appointments, setAppointments] = useState<AppointmentRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [quickPatient, setQuickPatient] = useState("")
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState<AppointmentRow | null>(null)
  const [form, setForm] = useState({ patientId: "", time: "09:00", type: "", notes: "" })

  const fetchDay = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const from = `${date}T00:00:00`
      const to = `${date}T23:59:59`
      const res = await fetch(`/api/app/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const data = await res.json()
      if (res.ok) setAppointments(data.appointments)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDay(day)
  }, [day, fetchDay])

  const changeDay = (offset: number) => {
    const d = new Date(day + "T12:00:00")
    d.setDate(d.getDate() + offset)
    setDay(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
  }

  const submit = async () => {
    if (!form.patientId) {
      toast("Selecione o paciente.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/app/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startsAt: `${day}T${form.time}` }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao agendar.")
      toast("Atendimento agendado.", "success")
      setShowNew(false)
      setForm({ patientId: "", time: "09:00", type: "", notes: "" })
      fetchDay(day)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (appt: AppointmentRow, status: AppointmentRow["status"]) => {
    try {
      const res = await fetch(`/api/app/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast(STATUS_META[status].label + ".", "success")
      fetchDay(day)
    } catch (e) {
      toast((e as Error).message, "error")
    }
  }

  const confirmCancel = async () => {
    if (!cancelling) return
    setSaving(true)
    try {
      const res = await fetch(`/api/app/appointments/${cancelling.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast("Atendimento cancelado.", "success")
      setCancelling(null)
      fetchDay(day)
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const filteredPatients = initialPatients.filter((p) => p.fullName.toLowerCase().includes(quickPatient.toLowerCase())).slice(0, 8)

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Agenda <span className="text-gradient">de atendimentos</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie os horários da clínica.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => changeDay(-1)} className="px-2.5">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-auto" />
          <Button variant="outline" onClick={() => changeDay(1)} className="px-2.5">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="anim-fade-up flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <CalendarDays className="h-4 w-4 text-sky-400" />
          {formatDate(day)}
        </span>
        {appointments && (
          <span className="text-xs text-slate-500">
            {appointments.filter((a) => ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status)).length} agendados
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <LinkButton href="/app/pacientes/novo" variant="outline" size="sm">
            <UserPlus className="h-3.5 w-3.5" /> Novo paciente
          </LinkButton>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> Agendar atendimento
          </Button>
        </div>
      </div>

      <div className="anim-fade-up stagger space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[68px] rounded-2xl" />)
        ) : !appointments || appointments.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="inbox"
                title="Sem atendimentos neste dia"
                description="Agende o primeiro atendimento do dia."
                action={
                  <Button onClick={() => setShowNew(true)}>
                    <Plus className="h-4 w-4" /> Agendar atendimento
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : (
          appointments.map((a) => {
            const meta = STATUS_META[a.status]
            const active = a.status === "SCHEDULED" || a.status === "CONFIRMED" || a.status === "IN_PROGRESS"
            return (
              <Card key={a.id} className="transition hover:-translate-y-0.5">
                <CardBody>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="w-24 shrink-0">
                      <p className="text-lg font-bold text-white">{a.startsAt.slice(11, 16)}</p>
                      {a.endsAt && <p className="text-[11px] text-slate-600">até {a.endsAt.slice(11, 16)}</p>}
                    </div>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-xs font-bold text-white">
                      {a.patient.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/app/pacientes/${a.patient.id}`} className="truncate text-sm font-semibold text-slate-100 hover:text-sky-300">
                          {a.patient.fullName}
                        </Link>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        {a.type && <span className="text-xs text-slate-500">{a.type}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {a.patient.phone && (
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {a.patient.phone}</span>
                        )}
                        {a.user && <span className="inline-flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {a.user.name}</span>}
                        {a.notes && <span className="truncate italic">{a.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {active && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => changeStatus(a, "IN_PROGRESS")} disabled={a.status === "IN_PROGRESS"}>
                            Iniciar
                          </Button>
                          <Button size="sm" onClick={() => changeStatus(a, "COMPLETED")}>
                            <Check className="h-3.5 w-3.5" /> Concluir
                          </Button>
                          <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => setCancelling(a)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      {a.status === "IN_PROGRESS" && (
                        <Button size="sm" variant="outline" onClick={() => changeStatus(a, "COMPLETED")}>
                          <Check className="h-3.5 w-3.5" /> Finalizar
                        </Button>
                      )}
                      {a.status === "COMPLETED" && (
                        <LinkButton href={`/app/pacientes/${a.patient.id}`} size="sm" variant="outline">
                          Ver paciente
                        </LinkButton>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title={`Agendar atendimento — ${formatDate(day)}`}>
        <div className="space-y-4">
          <Field label="Paciente" required>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                value={quickPatient}
                onChange={(e) => setQuickPatient(e.target.value)}
                placeholder="Buscar paciente..."
                className="pl-9"
              />
            </div>
            {quickPatient && filteredPatients.length > 0 && (
              <div className="mt-2 space-y-1">
                {filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, patientId: p.id })
                      setQuickPatient(p.fullName)
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-[#1c2942] bg-[#0a1120] px-3 py-2 text-left text-sm text-slate-300 transition hover:border-sky-700/50"
                  >
                    <span>{p.fullName}</span>
                    {p.phone && <span className="text-xs text-slate-600">{p.phone}</span>}
                  </button>
                ))}
              </div>
            )}
            {quickPatient && filteredPatients.length === 0 && (
              <p className="mt-2 text-xs text-slate-600">
                Nenhum paciente encontrado.{" "}
                <Link href="/app/pacientes/novo" className="text-sky-400 hover:text-sky-300">Cadastre agora</Link>
              </p>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Horário" required>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </Field>
            <Field label="Tipo de atendimento">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="">Selecione</option>
                <option value="Consulta">Consulta</option>
                <option value="Retorno">Retorno</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Procedimento">Procedimento</option>
                <option value="Urgência">Urgência</option>
              </Select>
            </Field>
          </div>
          <Field label="Observações">
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Motivo da consulta, observações..." />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={saving || !form.patientId}>
              <Clock className="h-4 w-4" /> {saving ? "Agendando..." : "Confirmar agendamento"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
        title="Cancelar atendimento"
        message={`Deseja cancelar o atendimento de ${cancelling?.patient.fullName} às ${cancelling?.startsAt.slice(11, 16)}?`}
        confirmLabel={saving ? "Cancelando..." : "Cancelar atendimento"}
        danger
      />
    </div>
  )
}