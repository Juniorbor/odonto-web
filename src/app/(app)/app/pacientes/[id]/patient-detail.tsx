"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ClipboardList,
  Eye,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ScanLine,
  Stethoscope,
  Upload,
  UserRound,
  Sparkles,
} from "lucide-react"
import { Card, CardBody, Badge } from "@/components/ui/card"
import { Button, LinkButton } from "@/components/ui/button"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { EmptyState } from "@/components/ui/feedback"
import { RadiographViewer } from "@/components/radiograph-viewer"
import { formatDate, formatCpf, formatPhone, calculateAge, initials, todayInput } from "@/lib/utils"
import { uploadWithChunks } from "@/lib/client-upload"

type PatientData = {
  id: string
  photoUrl: string | null
  fullName: string
  socialName: string | null
  cpf: string | null
  rg: string | null
  birthDate: string | null
  sex: string | null
  maritalStatus: string | null
  occupation: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  cep: string | null
  guardian: string | null
  observations: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  _count: { appointments: number; clinicalRecords: number; documents: number; radiographs: number; odontograms: number; patientImages: number }
}

type AppointmentRow = {
  id: string
  startsAt: string
  status: string
  type: string | null
  user: { name: string } | null
}

type RecordRow = {
  id: string
  createdAt: string
  chiefComplaint: string | null
  observations: string | null
  user: { name: string } | null
}

type DocRow = { id: string; title: string; type: string; createdAt: string }
type RadioRow = { id: string; label: string | null; takenAt: string; mimeType: string }
type PhotoRow = { id: string; category: string; label: string | null; takenAt: string }
type HistRow = {
  id: string
  version: number
  signedAt: string | null
  createdAt: string
  hasDisease: boolean | null
  diseaseDescription: string | null
  underMedicalTreatment: boolean | null
}

const APPT_STATUS: Record<string, { label: string; tone: string }> = {
  SCHEDULED: { label: "Agendado", tone: "info" },
  CONFIRMED: { label: "Confirmado", tone: "success" },
  IN_PROGRESS: { label: "Em atendimento", tone: "warning" },
  COMPLETED: { label: "Concluído", tone: "success" },
  CANCELLED: { label: "Cancelado", tone: "danger" },
  NO_SHOW: { label: "Faltou", tone: "danger" },
}

const RECORD_TONE: Record<string, string> = {
  "primeira consulta": "border-sky-500/25 bg-sky-500/10 text-sky-300",
  evolução: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  retorno: "border-violet-500/25 bg-violet-500/10 text-violet-300",
}

export function PatientDetail({
  patient,
  medicalHistories,
  appointments,
  clinicalRecords,
  documents,
  radiographs,
  patientImages,
  canEdit,
  modules,
}: {
  patient: PatientData
  medicalHistories: HistRow[]
  appointments: AppointmentRow[]
  clinicalRecords: RecordRow[]
  documents: DocRow[]
  radiographs: RadioRow[]
  patientImages: PhotoRow[]
  canEdit: boolean
  modules: string[]
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [viewer, setViewer] = useState<{ id: string; label: string | null; fileUrl: string; mimeType?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captureInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    fullName: patient.fullName,
    socialName: patient.socialName ?? "",
    cpf: patient.cpf ?? "",
    rg: patient.rg ?? "",
    birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : "",
    sex: patient.sex ?? "",
    maritalStatus: patient.maritalStatus ?? "",
    occupation: patient.occupation ?? "",
    phone: patient.phone ?? "",
    whatsapp: patient.whatsapp ?? "",
    email: patient.email ?? "",
    address: patient.address ?? "",
    city: patient.city ?? "",
    state: patient.state ?? "",
    cep: patient.cep ?? "",
    guardian: patient.guardian ?? "",
    observations: patient.observations ?? "",
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.fullName.trim()) {
      toast("Informe o nome.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/app/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      toast("Dados atualizados.", "success")
      setEditing(false)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const confirmArchive = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/app/patients/${patient.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast("Paciente arquivado.", "success")
      router.push("/app/pacientes")
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
      setArchiving(false)
    }
  }

  const capturePhoto = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const res = await uploadWithChunks("/api/app/images", file, () => ({
        patientId: patient.id,
        category: "INTRAORAL",
        takenAt: new Date().toISOString().slice(0, 10),
      }))
      if (!res.ok) throw new Error(res.error || "Erro no upload.")
      toast("Foto enviada para a galeria. Categoria pode ser editada em Fotografias.", "success")
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const latestHistory = medicalHistories[0]

  const uploadRadiograph = async (file: File) => {
    setUploading(true)
    try {
      const res = await uploadWithChunks("/api/app/radiographs", file, () => ({
        patientId: patient.id,
        examType: "PANORAMICA",
        label: "Panorâmica",
      }))
      if (!res.ok) throw new Error(res.error || "Erro no upload.")
      toast("Radiografia panorâmica enviada.", "success")
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <Link href="/app/pacientes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-sky-300">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        {canEdit && (
          <div className="flex items-center gap-2">
            {patient.active && (
              <Button variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => setArchiving(true)}>
                Arquivar
              </Button>
            )}
            <Button onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Editar cadastro
            </Button>
          </div>
        )}
      </div>

      <div className="anim-fade-up grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardBody className="text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-2xl font-bold text-white">
                {initials(patient.fullName)}
              </span>
              <h1 className="mt-4 text-lg font-bold text-white">{patient.fullName}</h1>
              {patient.socialName && <p className="text-xs text-slate-500">Nome social: {patient.socialName}</p>}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {!patient.active && <Badge tone="danger">Inativo</Badge>}
                <Badge tone="info">Paciente</Badge>
              </div>
              <div className="mt-4 space-y-1.5 text-left text-xs text-slate-400">
                {patient.cpf && <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-slate-600" /> {formatCpf(patient.cpf)}</p>}
                {patient.birthDate && (
                  <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-slate-600" /> {formatDate(patient.birthDate)} · {calculateAge(patient.birthDate)} anos</p>
                )}
                {patient.sex && <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-slate-600" /> {patient.sex === "F" ? "Feminino" : patient.sex === "M" ? "Masculino" : patient.sex}</p>}
                {patient.maritalStatus && <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-slate-600" /> {patient.maritalStatus}</p>}
                {patient.occupation && <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-slate-600" /> {patient.occupation}</p>}
                {patient.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-600" /> {formatPhone(patient.phone)}</p>}
                {patient.whatsapp && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-600" /> WhatsApp {formatPhone(patient.whatsapp)}</p>}
                {patient.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-600" /> {patient.email}</p>}
                {(patient.city || patient.state) && (
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-600" /> {[patient.city, patient.state].filter(Boolean).join(" / ")}</p>
                )}
                {patient.guardian && <p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-slate-600" /> Resp.: {patient.guardian}</p>}
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card><CardBody className="text-center"><p className="text-xl font-bold text-white">{patient._count.appointments}</p><p className="text-[10px] text-slate-500">Atendimentos</p></CardBody></Card>
            <Card><CardBody className="text-center"><p className="text-xl font-bold text-white">{patient._count.clinicalRecords}</p><p className="text-[10px] text-slate-500">Evoluções</p></CardBody></Card>
            <Card><CardBody className="text-center"><p className="text-xl font-bold text-white">{patient._count.radiographs}</p><p className="text-[10px] text-slate-500">Radiografias</p></CardBody></Card>
            <Card><CardBody className="text-center"><p className="text-xl font-bold text-white">{patient._count.patientImages}</p><p className="text-[10px] text-slate-500">Fotos</p></CardBody></Card>
          </div>

          <Card>
            <CardBody>
              <h3 className="mb-3 text-sm font-semibold text-slate-100">Ações rápidas</h3>
              <div className="flex flex-col gap-2">
                {modules.includes("appointments") && (
                  <LinkButton href={`/app/atendimentos/novo?patientId=${patient.id}`} variant="outline" size="sm" className="justify-start">
                    <Stethoscope className="h-4 w-4" /> Novo atendimento
                  </LinkButton>
                )}
                {modules.includes("odontogram") && (
                  <LinkButton href={`/app/odontograma?patientId=${patient.id}`} variant="outline" size="sm" className="justify-start">
                    <ClipboardList className="h-4 w-4" /> Odontograma
                  </LinkButton>
                )}
                {modules.includes("radiographs") && (
                  <>
                    <LinkButton href={`/app/radiografias?patientId=${patient.id}`} variant="outline" size="sm" className="justify-start">
                      <ScanLine className="h-4 w-4" /> Radiografias
                    </LinkButton>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => fileInputRef.current?.click()}
                      loading={uploading}
                    >
                      <Upload className="h-4 w-4" /> Adicionar radiografia
                    </Button>
                  </>
                )}
                {modules.includes("images") && (
                  <>
                    <LinkButton href={`/app/fotografias?patientId=${patient.id}`} variant="outline" size="sm" className="justify-start">
                      <Camera className="h-4 w-4" /> Fotografias
                    </LinkButton>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => captureInputRef.current?.click()}
                      loading={uploadingPhoto}
                      title="Abrir a câmera e enviar a foto direto para a galeria"
                    >
                      <Camera className="h-4 w-4" /> Tirar foto
                    </Button>
                    <input
                      ref={captureInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="pointer-events-none absolute h-px w-px opacity-0"
                      style={{ position: "fixed", left: "-9999px", top: "0" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) capturePhoto(f)
                        e.target.value = ""
                      }}
                    />
                  </>
                )}
                {modules.includes("ai") && (
                  <LinkButton href={`/app/ia?patientId=${patient.id}`} variant="outline" size="sm" className="justify-start">
                    <Sparkles className="h-4 w-4" /> Assistente IA
                  </LinkButton>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">
                  Anamnese{latestHistory ? ` · v${latestHistory.version}` : ""}
                </h3>
                {latestHistory && <span className="text-xs text-slate-500">{formatDate(latestHistory.createdAt)}</span>}
              </div>
              {latestHistory ? (
                <>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
                      <p className="text-[11px] text-slate-500">Doença pré-existente</p>
                      <p className="mt-0.5 text-sm text-slate-200">
                        {latestHistory.hasDisease ? latestHistory.diseaseDescription || "Sim" : "Não informado"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
                      <p className="text-[11px] text-slate-500">Tratamento médico</p>
                      <p className="mt-0.5 text-sm text-slate-200">{latestHistory.underMedicalTreatment ? "Em tratamento" : "Não informado"}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3">
                  <EmptyState icon="file" title="Sem anamnese" description="Registre o questionário completo deste paciente." />
                </div>
              )}
              <LinkButton href={`/app/pacientes/${patient.id}/anamnese`} variant="ghost" size="sm" className="mt-3">
                <ClipboardList className="h-3.5 w-3.5" /> Anamnese completa
              </LinkButton>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Histórico clínico</h3>
                <LinkButton href={`/app/atendimentos/novo?patientId=${patient.id}`} size="sm">
                  <Stethoscope className="h-3.5 w-3.5" /> Nova evolução
                </LinkButton>
              </div>
              {clinicalRecords.length === 0 ? (
                <EmptyState icon="file" title="Sem evoluções" description="Registre a primeira evolução clínica deste paciente." />
              ) : (
                <div className="space-y-2.5">
                  {clinicalRecords.map((r) => (
                    <div key={r.id} className="rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">{formatDate(r.createdAt, true)}</span>
                        </div>
                        <span className="text-[11px] text-slate-600">{r.user?.name}</span>
                      </div>
                      {r.chiefComplaint && <p className="mt-2 text-sm text-slate-300">{r.chiefComplaint}</p>}
                      {r.observations && <p className="mt-1 text-xs text-slate-500">{r.observations}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Atendimentos</h3>
                <LinkButton href="/app/agenda" variant="ghost" size="sm">Ver agenda</LinkButton>
              </div>
              {appointments.length === 0 ? (
                <EmptyState icon="inbox" title="Sem atendimentos" description="Agende o primeiro atendimento na agenda." />
              ) : (
                <div className="space-y-2.5">
                  {appointments.map((a) => (
                    <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200">{a.type || "Atendimento"}</p>
                        <p className="text-xs text-slate-500">{formatDate(a.startsAt, true)} {a.user ? `· ${a.user.name}` : ""}</p>
                      </div>
                      <Badge tone={(APPT_STATUS[a.status]?.tone ?? "neutral") as never}>
                        {APPT_STATUS[a.status]?.label ?? a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardBody>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100"><FileText className="h-4 w-4 text-slate-500" /> Documentos</h3>
                {documents.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhum documento.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-2.5 text-sm">
                        <span className="truncate text-slate-300">{d.title}</span>
                        <span className="ml-2 shrink-0 text-[11px] text-slate-600">{formatDate(d.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100"><ScanLine className="h-4 w-4 text-slate-500" /> Radiografias</h3>
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} loading={uploading}>
                    <Upload className="h-3.5 w-3.5" /> Panorâmica
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadRadiograph(f)
                      e.target.value = ""
                    }}
                  />
                </div>
                {radiographs.length === 0 ? (
                  <p className="text-sm text-slate-600">Nenhuma imagem. Envie uma radiografia panorâmica para anotar.</p>
                ) : (
                  <div className="space-y-2">
                    {radiographs.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-2.5 text-sm">
                        <span className="truncate text-slate-300">{r.label || "Radiografia"}</span>
                        <span className="ml-2 flex shrink-0 items-center gap-1.5">
                          <span className="text-[11px] text-slate-600">{formatDate(r.takenAt)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-sky-300 hover:text-sky-200"
                            onClick={() => setViewer({ id: r.id, label: r.label, fileUrl: `/api/app/radiographs/${r.id}/file`, mimeType: r.mimeType })}
                          >
                            <Eye className="h-3.5 w-3.5" /> Anotar
                          </Button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardBody>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Camera className="h-4 w-4 text-slate-500" /> Fotografias clínicas
              </h3>
              <div className="mb-3 flex gap-2">
                <Button size="sm" onClick={() => captureInputRef.current?.click()} loading={uploadingPhoto}>
                  <Camera className="h-3.5 w-3.5" /> Tirar foto
                </Button>
                <LinkButton href={`/app/fotografias?patientId=${patient.id}`} variant="outline" size="sm">
                  <Upload className="h-3.5 w-3.5" /> Ver galeria
                </LinkButton>
              </div>
              {patientImages.length === 0 ? (
                <p className="text-sm text-slate-600">Nenhuma foto. Toque em Tirar foto ou adicione fotos na galeria.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {patientImages.map((p) => (
                    <Link
                      key={p.id}
                      href={`/app/fotografias?patientId=${patient.id}`}
                      className="group block overflow-hidden rounded-xl border border-[#16213a] bg-[#0b1220]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/app/images/${p.id}/file`}
                        alt={p.label || "Foto clínica"}
                        className="aspect-[4/3] w-full object-cover transition group-hover:opacity-90"
                      />
                      <p className="truncate px-2 py-1.5 text-[10px] text-slate-500">
                        {p.category === "EXTRAORAL" ? "Extrabucal" : "Intrabucal"}
                        {p.takenAt ? ` • ${formatDate(p.takenAt)}` : ""}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {patient.observations && (
            <Card>
              <CardBody>
                <h3 className="mb-2 text-sm font-semibold text-slate-100">Observações</h3>
                <p className="whitespace-pre-wrap text-sm text-slate-400">{patient.observations}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar cadastro">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" required>
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
            </Field>
            <Field label="Nome social">
              <Input value={form.socialName} onChange={(e) => set("socialName", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="CPF"><Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} /></Field>
            <Field label="RG"><Input value={form.rg} onChange={(e) => set("rg", e.target.value)} /></Field>
            <Field label="Nascimento">
              <Input value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} type="date" max={todayInput()} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Sexo">
              <Select value={form.sex} onChange={(e) => set("sex", e.target.value)}>
                <option value="">Selecione</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </Select>
            </Field>
            <Field label="Estado civil">
              <Select value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                <option value="">Selecione</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
                <option value="União estável">União estável</option>
              </Select>
            </Field>
            <Field label="Ocupação"><Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="WhatsApp"><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></Field>
          </div>
          <Field label="E-mail"><Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" /></Field>
          <Field label="Endereço"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cidade"><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="UF"><Input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} /></Field>
            <Field label="CEP"><Input value={form.cep} onChange={(e) => set("cep", e.target.value)} /></Field>
          </div>
          <Field label="Responsável (menor)">
            <Input value={form.guardian} onChange={(e) => set("guardian", e.target.value)} />
          </Field>
          <Field label="Observações">
            <Textarea value={form.observations} onChange={(e) => set("observations", e.target.value)} rows={3} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={archiving}
        onClose={() => setArchiving(false)}
        onConfirm={confirmArchive}
        title="Arquivar paciente"
        message={`O paciente ${patient.fullName} será arquivado e deixará de aparecer na lista ativa. Os dados clínicos serão preservados.`}
        confirmLabel={saving ? "Arquivando..." : "Arquivar paciente"}
        danger
      />

      {viewer && <RadiographViewer open onClose={() => setViewer(null)} radiograph={viewer} />}
    </div>
  )
}