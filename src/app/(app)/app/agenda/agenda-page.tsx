"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Ban,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react"
import { Card, CardBody, Badge } from "@/components/ui/card"
import { Button, LinkButton } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { Skeleton } from "@/components/ui/feedback"
import { formatDate, todayInput, cn } from "@/lib/utils"

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
  professional: { id: string; fullName: string } | null
  user: { id: string; name: string } | null
}

type View = "dia" | "semana"

const HOUR_START = 7
const HOUR_END = 20
const HOUR_PX = 60
const TOTAL_HOURS = HOUR_END - HOUR_START
const TOTAL_HEIGHT = TOTAL_HOURS * HOUR_PX
const SLOTS = TOTAL_HOURS * 2

const STATUS_META: Record<
  AppointmentRow["status"],
  { label: string; tone: "info" | "success" | "warning" | "danger"; blockBg: string; blockBorder: string }
> = {
  SCHEDULED: { label: "Agendado", tone: "info", blockBg: "rgba(56,189,248,0.12)", blockBorder: "rgba(56,189,248,0.45)" },
  CONFIRMED: { label: "Confirmado", tone: "success", blockBg: "rgba(16,185,129,0.14)", blockBorder: "rgba(16,185,129,0.5)" },
  IN_PROGRESS: { label: "Em atendimento", tone: "warning", blockBg: "rgba(245,158,11,0.14)", blockBorder: "rgba(245,158,11,0.5)" },
  COMPLETED: { label: "Concluído", tone: "success", blockBg: "rgba(100,116,139,0.12)", blockBorder: "rgba(100,116,139,0.3)" },
  CANCELLED: { label: "Cancelado", tone: "danger", blockBg: "rgba(100,116,139,0.05)", blockBorder: "rgba(100,116,139,0.18)" },
  NO_SHOW: { label: "Faltou", tone: "danger", blockBg: "rgba(244,63,94,0.12)", blockBorder: "rgba(244,63,94,0.45)" },
}

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

const pad = (n: number) => String(n).padStart(2, "0")
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseDay = (key: string) => new Date(key + "T12:00:00")
const addDays = (key: string, n: number) => {
  const d = parseDay(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}
const firstDayOfWeek = (key: string) => {
  const d = parseDay(key)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return toKey(d)
}
const weekdayLabel = (day: string) => WEEKDAYS[(parseDay(day).getDay() + 6) % 7]
const minutesOf = (iso: string) => {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}
const timeFmt = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`

export function AgendaPage({
  patients: initialPatients,
  professionals,
}: {
  patients: AgendaPatient[]
  professionals: AgendaProfessional[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [view, setView] = useState<View>("semana")
  const [anchor, setAnchor] = useState(todayInput())
  const [appointments, setAppointments] = useState<AppointmentRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [calMonth, setCalMonth] = useState(anchor.slice(0, 7))
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({})
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [profFilter, setProfFilter] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState<AppointmentRow | null>(null)
  const [detail, setDetail] = useState<AppointmentRow | null>(null)
  const [quickPatient, setQuickPatient] = useState("")
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState<AppointmentRow | null>(null)
  const [deleting, setDeleting] = useState<AppointmentRow | null>(null)
  const [formDate, setFormDate] = useState(anchor)
  const [form, setForm] = useState({ patientId: "", professionalId: "", time: "09:00", duration: "30", type: "", notes: "" })

  const fetchAppointments = useCallback(async (v: View, anchorKey: string) => {
    setLoading(true)
    try {
      const start = firstDayOfWeek(anchorKey)
      const end = addDays(start, 7)
      const [sy, sm, sd] = start.split("-").map(Number)
      const [ey, em, ed] = end.split("-").map(Number)
      const from = new Date(sy, sm - 1, sd, 0, 0, 0).toISOString()
      const to = new Date(ey, em - 1, ed, 23, 59, 59).toISOString()
      const res = await fetch(`/api/app/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const data = await res.json()
      if (res.ok) setAppointments(data.appointments)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments(view, anchor)
  }, [view, anchor, fetchAppointments])

  const fetchMonth = useCallback(async (month: string) => {
    setCalendarLoading(true)
    try {
      const [y, m] = month.split("-").map(Number)
      const from = new Date(y, m - 1, 1, 0, 0, 0).toISOString()
      const to = new Date(y, m, 1, 0, 0, 0).toISOString()
      const res = await fetch(`/api/app/appointments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      const data = await res.json()
      if (res.ok) {
        const counts: Record<string, number> = {}
        for (const a of data.appointments) {
          const k = toKey(new Date(a.startsAt))
          counts[k] = (counts[k] ?? 0) + 1
        }
        setMonthCounts(counts)
      }
    } finally {
      setCalendarLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonth(calMonth)
  }, [calMonth, fetchMonth])

  const displayDays = view === "semana" ? weekDays() : [anchor]
  function weekDays() {
    const monday = firstDayOfWeek(anchor)
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  }

  const nudge = (dir: number) => {
    setAnchor((a) => (view === "dia" ? addDays(a, dir) : addDays(a, dir * 7)))
  }

  const goToday = () => {
    const t = todayInput()
    setAnchor(t)
    setCalMonth(t.slice(0, 7))
  }

  const visible = useMemo(() => {
    if (!appointments) return []
    return appointments.filter((a) => !profFilter || a.professional?.id === profFilter)
  }, [appointments, profFilter])

  const activeCount = useMemo(
    () => visible.filter((a) => ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(a.status)).length,
    [visible],
  )

  const blockStyle = (a: AppointmentRow) => {
    const start = minutesOf(a.startsAt)
    const end = a.endsAt ? Math.max(minutesOf(a.endsAt), start + 15) : start + 30
    const top = Math.max(((start / 60) - HOUR_START) * HOUR_PX, 0)
    const h = Math.max(((end - start) / 60) * HOUR_PX, 20)
    return { top, h, meta: STATUS_META[a.status] }
  }

  const openSlot = (day: string, minute: number) => {
    const t = timeFmt(minute)
    setFormDate(day)
    setEditing(null)
    setQuickPatient("")
    setForm({ patientId: "", professionalId: profFilter, time: t, duration: "30", type: "", notes: "" })
    setShowNew(true)
  }

  const openEdit = (a: AppointmentRow) => {
    const startMin = minutesOf(a.startsAt)
    const endMin = a.endsAt ? Math.max(minutesOf(a.endsAt), startMin + 15) : startMin + 30
    const dur = String(Math.max(15, endMin - startMin))
    setFormDate(toKey(new Date(a.startsAt)))
    setForm({ patientId: a.patient.id, professionalId: a.professional?.id || "", time: timeFmt(startMin), duration: dur, type: a.type || "", notes: a.notes || "" })
    setQuickPatient(a.patient.fullName)
    setEditing(a)
    setDetail(null)
    setShowNew(true)
  }

  const submit = async () => {
    if (!form.patientId) {
      toast("Selecione o paciente.", "error")
      return
    }
    if (!formDate) {
      toast("Informe a data.", "error")
      return
    }
    const [hh, mm] = form.time.split(":").map(Number)
    if (hh === undefined || Number.isNaN(hh) || Number.isNaN(mm)) {
      toast("Horário inválido.", "error")
      return
    }
    const startMin = (hh || 0) * 60 + (mm || 0)
    const dur = Math.max(15, Number(form.duration) || 30)
    const startDt = new Date(
      Number(formDate.slice(0, 4)),
      Number(formDate.slice(5, 7)) - 1,
      Number(formDate.slice(8, 10)),
      hh || 0,
      mm || 0,
    )
    const startsAt = startDt.toISOString()
    const endsAt = new Date(startDt.getTime() + dur * 60000).toISOString()
    const payload = {
      patientId: form.patientId,
      professionalId: form.professionalId || undefined,
      startsAt,
      endsAt,
      type: form.type,
      notes: form.notes,
    }
    setSaving(true)
    try {
      const url = editing ? `/api/app/appointments/${editing.id}` : "/api/app/appointments"
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast(editing ? "Agendamento atualizado." : "Atendimento agendado.", "success")
      setShowNew(false)
      setEditing(null)
      setAnchor(formDate)
      setCalMonth(formDate.slice(0, 7))
      fetchAppointments(view, formDate)
      fetchMonth(formDate.slice(0, 7))
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
      setDetail(null)
      fetchAppointments(view, anchor)
      fetchMonth(calMonth)
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
      setDetail(null)
      fetchAppointments(view, anchor)
      fetchMonth(calMonth)
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setSaving(true)
    try {
      const res = await fetch(`/api/app/appointments/${deleting.id}?hard=1`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast("Atendimento excluído.", "success")
      setDeleting(null)
      setDetail(null)
      fetchAppointments(view, anchor)
      fetchMonth(calMonth)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const filteredPatients = initialPatients.filter((p) => p.fullName.toLowerCase().includes(quickPatient.toLowerCase())).slice(0, 8)
  const selectedPatient = initialPatients.find((p) => p.id === form.patientId)

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i)

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 sm:space-y-6 px-3.5 py-4 sm:px-6 sm:py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">
            Agenda <span className="text-gradient">de atendimentos</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie os horários da clínica — clique num horário para agendar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-[#1c2942] bg-[#0a1120] p-1">
            {(["semana", "dia"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  view === v ? "bg-sky-500/15 text-sky-300" : "text-slate-500 hover:text-slate-300",
                )}
              >
                {v === "semana" ? "Semana" : "Dia"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => nudge(-1)} className="px-2.5">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={goToday}
              className="rounded-xl border border-[#1c2942] bg-[#0a1120] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-sky-700/50 hover:text-white"
            >
              Hoje
            </button>
            <Button variant="outline" onClick={() => nudge(1)} className="px-2.5">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => openSlot(anchor, 9 * 60)}>
            <Plus className="h-4 w-4" /> Agendar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="order-2 space-y-4 xl:order-1">
          <Card>
            <CardBody>
              <MonthGrid
                month={calMonth}
                counts={monthCounts}
                anchor={anchor}
                loading={calendarLoading}
                onMonthChange={setCalMonth}
                onSelectDay={(day) => {
                  setAnchor(day)
                  setCalMonth(day.slice(0, 7))
                  setView("dia")
                }}
              />
            </CardBody>
          </Card>

          {professionals.length > 0 && (
            <Card>
              <CardBody className="space-y-3">
                <p className="text-xs font-semibold text-slate-300">Profissional</p>
                <Select value={profFilter} onChange={(e) => setProfFilter(e.target.value)}>
                  <option value="">Todos</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                      {p.specialty ? ` — ${p.specialty}` : ""}
                    </option>
                  ))}
                </Select>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody className="space-y-3">
              <p className="text-xs font-semibold text-slate-300">Legenda</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELLED"] as AppointmentRow["status"][]).map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_META[s].blockBorder }} />
                    {STATUS_META[s].label}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="order-1 min-w-0 xl:order-2">
          <div className="anim-fade-up mb-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <CalendarDays className="h-4 w-4 text-sky-400" />
              {view === "semana"
                ? `${formatDate(displayDays[0])} — ${formatDate(displayDays[displayDays.length - 1])}`
                : formatDate(anchor)}
            </span>
            {appointments && (
              <span className="rounded-full border border-sky-700/40 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-300">
                {activeCount} ativo{activeCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {appointments && visible.length === 0 && !loading && (
            <p className="anim-fade-up mb-3 text-xs text-slate-600">
              Nenhum atendimento neste período — clique num horário livre para agendar.
            </p>
          )}

          {loading ? (
            <div className="space-y-2 rounded-2xl border border-[#1c2942] bg-[#0a1120] p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1c2942] bg-[#0a1120]/50">
              <div className="flex border-b border-[#1c2942]">
                <div className="w-14 shrink-0" />
                {displayDays.map((day) => {
                  const isToday = day === todayInput()
                  const isAnchor = day === anchor
                  return (
                    <div key={day} className="min-w-0 flex-1 border-l border-[#12203a]">
                      <button
                        onClick={() => setView("dia")}
                        className={cn(
                          "w-full px-2 py-2 text-center transition",
                          isToday ? "bg-sky-500/10" : "bg-[#0a1120]",
                        )}
                      >
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", isToday ? "text-sky-400" : "text-slate-500")}>
                          {view === "semana" ? weekdayLabel(day) : isToday ? "Hoje" : formatDate(day).slice(0, 5)}
                        </p>
                        <p className={cn("text-sm font-bold leading-tight", isAnchor ? "text-sky-300" : isToday ? "text-white" : "text-slate-200")}>
                          {day.slice(8, 10)}
                        </p>
                        <p className="text-[10px] leading-tight text-slate-600">
                          {visible.filter((a) => toKey(new Date(a.startsAt)) === day).length}
                        </p>
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex">
                <div className="relative w-14 shrink-0 border-r border-[#1c2942]" style={{ height: TOTAL_HEIGHT }}>
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute right-2 text-[10px] font-semibold leading-none text-slate-500"
                      style={{ top: (h - HOUR_START) * HOUR_PX + 2 }}
                    >
                      {timeFmt(h * 60)}
                    </div>
                  ))}
                </div>

                {displayDays.map((day) => {
                  const dayAppts = visible.filter((a) => toKey(new Date(a.startsAt)) === day)
                  return (
                    <div key={day} className="relative min-w-0 flex-1 border-l border-[#12203a]" style={{ height: TOTAL_HEIGHT }}>
                      {Array.from({ length: SLOTS + 1 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "pointer-events-none absolute left-0 right-0 border-t",
                            i % 2 === 0 ? "border-[#1c2942]" : "border-[#0e1a2e]",
                          )}
                          style={{ top: (i * HOUR_PX) / 2 }}
                        />
                      ))}
                      {Array.from({ length: SLOTS }).map((_, i) => {
                        const minute = HOUR_START * 60 + i * 30
                        return (
                          <button
                            key={i}
                            onClick={() => openSlot(day, minute)}
                            aria-label={`Agendar ${timeFmt(minute)}`}
                            className="absolute left-0 right-0 transition hover:bg-sky-500/10"
                            style={{ top: (i * HOUR_PX) / 2, height: HOUR_PX / 2 }}
                          />
                        )
                      })}
                      {dayAppts.map((a) => {
                        const { top, h, meta } = blockStyle(a)
                        const cancelled = a.status === "CANCELLED"
                        const dimmed = cancelled || a.status === "COMPLETED"
                        return (
                          <button
                            key={a.id}
                            onClick={() => setDetail(a)}
                            className="absolute left-1 right-1 z-10 overflow-hidden rounded-lg border px-1.5 py-1 text-left transition hover:z-20 hover:-translate-y-px hover:shadow-lg"
                            style={{ top, height: h, background: meta.blockBg, borderColor: meta.blockBorder }}
                          >
                            <p className={cn("text-[10px] font-bold leading-tight", dimmed ? "text-slate-400" : "text-sky-200")}>
                              {timeFmt(minutesOf(a.startsAt))}
                            </p>
                            <p className={cn("truncate text-[11px] font-semibold leading-tight", cancelled ? "text-slate-500 line-through" : dimmed ? "text-slate-400" : "text-white")}>
                              {a.patient.fullName}
                            </p>
                            {h >= 40 && a.type && <p className="truncate text-[9px] leading-tight text-white/50">{a.type}</p>}
                            {h >= 56 && a.professional && (
                              <p className="truncate text-[9px] leading-tight text-white/50">{a.professional.fullName}</p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="anim-fade-up mt-4 flex flex-wrap justify-end gap-2">
            <LinkButton href="/app/pacientes/novo" variant="outline" size="sm">
              <UserPlus className="h-3.5 w-3.5" /> Novo paciente
            </LinkButton>
          </div>
        </div>
      </div>

      <Modal
        open={showNew}
        onClose={() => {
          setShowNew(false)
          setEditing(null)
        }}
        title={editing ? `Reagendar — ${editing.patient.fullName}` : `Agendar atendimento — ${formatDate(formDate)}`}
      >
        <div className="space-y-4">
          <Field label="Paciente" required>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input
                value={quickPatient}
                onChange={(e) => {
                  setQuickPatient(e.target.value)
                  if (e.target.value !== form.patientId) setForm({ ...form, patientId: "" })
                }}
                placeholder="Buscar paciente..."
                className="pl-9"
              />
            </div>
            {selectedPatient && (
              <div className="mt-2 flex items-center justify-between rounded-lg border border-sky-700/50 bg-sky-500/10 px-3 py-2 text-sm text-sky-200">
                <span className="truncate">{selectedPatient.fullName}</span>
                <span className="shrink-0 text-[10px] text-sky-400">Selecionado</span>
              </div>
            )}
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
            {quickPatient && filteredPatients.length === 0 && !selectedPatient && (
              <p className="mt-2 text-xs text-slate-600">
                Nenhum paciente encontrado.{" "}
                <Link href="/app/pacientes/novo" className="text-sky-400 hover:text-sky-300">
                  Cadastre agora
                </Link>
              </p>
            )}
          </Field>

          {professionals.length > 0 && (
            <Field label="Profissional">
              <Select value={form.professionalId} onChange={(e) => setForm({ ...form, professionalId: e.target.value })}>
                <option value="">Sem profissional</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                    {p.specialty ? ` — ${p.specialty}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data" required>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </Field>
            <Field label="Horário" required>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duração">
              <Select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                {[15, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </Select>
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
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Motivo da consulta, observações..."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setShowNew(false); setEditing(null) }}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              <Clock className="h-4 w-4" /> {saving ? "Salvando..." : editing ? "Salvar reagendamento" : "Confirmar agendamento"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Atendimento">
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-xs font-bold text-white">
                {detail.patient.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <Link href={`/app/pacientes/${detail.patient.id}`} className="text-sm font-semibold text-slate-100 hover:text-sky-300">
                  {detail.patient.fullName}
                </Link>
                <p className="text-xs text-slate-500">
                  {formatDate(toKey(new Date(detail.startsAt)))} · {timeFmt(minutesOf(detail.startsAt))}
                  {detail.endsAt ? `–${timeFmt(minutesOf(detail.endsAt))}` : ""}
                </p>
              </div>
              <Badge tone={STATUS_META[detail.status].tone}>{STATUS_META[detail.status].label}</Badge>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              {detail.type && <p className="flex items-center gap-2"><span className="font-semibold text-slate-500">Tipo:</span> {detail.type}</p>}
              {detail.patient.phone && <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-sky-400" /> {detail.patient.phone}</p>}
              {detail.professional && <p className="flex items-center gap-2"><Stethoscope className="h-3 w-3 text-sky-400" /> {detail.professional.fullName}</p>}
              {detail.notes && <p className="rounded-lg border border-[#1c2942] bg-[#0a1120] px-3 py-2 italic">{detail.notes}</p>}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => changeStatus(detail, "CONFIRMED")}
                disabled={detail.status === "CONFIRMED"}
              >
                <CheckCheck className="h-3.5 w-3.5" /> Confirmar
              </Button>
              <Button
                variant="outline"
                onClick={() => changeStatus(detail, "IN_PROGRESS")}
                disabled={detail.status === "IN_PROGRESS"}
              >
                <UserCheck className="h-3.5 w-3.5" /> Em atendimento
              </Button>
              <Button onClick={() => changeStatus(detail, "COMPLETED")} disabled={detail.status === "COMPLETED"}>
                <Check className="h-3.5 w-3.5" /> Concluir
              </Button>
              <Button
                variant="outline"
                className="text-rose-400 hover:bg-rose-500/10"
                onClick={() => changeStatus(detail, "NO_SHOW")}
                disabled={detail.status === "NO_SHOW"}
              >
                <Ban className="h-3.5 w-3.5" /> Faltou
              </Button>
              <Button variant="outline" onClick={() => openEdit(detail)}>
                <CalendarPlus className="h-3.5 w-3.5" /> Reagendar
              </Button>
              <Button
                variant="ghost"
                className="text-rose-400 hover:bg-rose-500/10"
                onClick={() => {
                  setCancelling(detail)
                }}
              >
                <X className="h-3.5 w-3.5" /> Cancelar atendimento
              </Button>
              <Button
                variant="ghost"
                className="text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-300"
                onClick={() => {
                  setDeleting(detail)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir da lista
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={confirmCancel}
        title="Cancelar atendimento"
        message={`Deseja cancelar o atendimento de ${cancelling?.patient.fullName} às ${cancelling ? timeFmt(minutesOf(cancelling.startsAt)) : ""}?`}
        confirmLabel={saving ? "Cancelando..." : "Cancelar atendimento"}
        danger
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Excluir atendimento"
        message={`Excluir definitivamente o atendimento de ${deleting?.patient.fullName} às ${deleting ? timeFmt(minutesOf(deleting.startsAt)) : ""}? Esta ação não pode ser desfeita.`}
        confirmLabel={saving ? "Excluindo..." : "Excluir da lista"}
        danger
      />
    </div>
  )
}

function MonthGrid({
  month,
  counts,
  anchor,
  loading,
  onMonthChange,
  onSelectDay,
}: {
  month: string
  counts: Record<string, number>
  anchor: string
  loading: boolean
  onMonthChange: (m: string) => void
  onSelectDay: (day: string) => void
}) {
  const [y, m] = month.split("-").map(Number)
  const firstDow = new Date(y, m - 1, 1).getDay()
  const offset = (firstDow + 6) % 7
  const daysInMonth = new Date(y, m, 0).getDate()
  const today = todayInput()
  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${pad(i + 1)}`),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onMonthChange(toKey(new Date(y, m - 2, 1)).slice(0, 7))}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-xs font-semibold capitalize text-slate-200">{label}</p>
        <button
          onClick={() => onMonthChange(toKey(new Date(y, m, 1)).slice(0, 7))}
          className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-center text-[10px] font-bold uppercase text-slate-600">
            {w}
          </span>
        ))}
        {cells.map((day, i) => {
          if (!day) return <span key={`empty-${i}`} />
          const c = counts[day] ?? 0
          const isSelected = day === anchor
          const isToday = day === today
          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={cn(
                "relative flex aspect-square w-full items-center justify-center rounded-lg text-xs font-semibold transition",
                isSelected
                  ? "bg-sky-500/20 text-sky-200"
                  : isToday
                    ? "text-white ring-1 ring-sky-500/50"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              {day.slice(8, 10)}
              {c > 0 && (
                <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sky-400" />
              )}
            </button>
          )
        })}
      </div>
      {loading && <div className="flex items-center gap-2 text-[11px] text-slate-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" /> Atualizando...</div>}
    </div>
  )
}