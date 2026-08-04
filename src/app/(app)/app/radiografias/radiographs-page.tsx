"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Camera, CalendarDays, FileUp, Trash2, Stethoscope } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/feedback"
import { Button } from "@/components/ui/button"
import { Input, Textarea, Select, Field } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { formatDate } from "@/lib/utils"

const EXAM_TYPES = [
  { value: "PANORAMICA", label: "Panorâmica" },
  { value: "PERIAPICAL", label: "Periapical" },
  { value: "INTERPROXIMAL", label: "Interproximal (bitewing)" },
  { value: "OCLUSAL", label: "Oclusal" },
  { value: "TOMOGRAFIA", label: "Tomografia" },
  { value: "CEFALOMETRIA", label: "Cefalometria" },
  { value: "FOTOGRAFIA", label: "Fotografia" },
  { value: "OUTRO", label: "Outro" },
]

type RadiographRow = {
  id: string
  patientId: string
  patient: { id: string; fullName: string }
  examType: string
  label: string | null
  originalPath: string
  mimeType: string
  sizeBytes: number
  takenAt: string
  notes: string | null
  reportObservations: string | null
  reportConclusion: string | null
  reportSignedAt: string | null
  url: string
}

export function RadiographsPage({ patients }: { patients: { id: string; fullName: string }[] }) {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [items, setItems] = useState<RadiographRow[]>([])
  const [loading, setLoading] = useState(true)
  const [patientFilter, setPatientFilter] = useState(searchParams.get("patientId") || "all")

  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewing, setViewing] = useState<RadiographRow | null>(null)
  const [deleting, setDeleting] = useState<RadiographRow | null>(null)
  const [saving, setSaving] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [formPatient, setFormPatient] = useState(searchParams.get("patientId") || "")
  const [formExam, setFormExam] = useState("PANORAMICA")
  const [formLabel, setFormLabel] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formTakenAt, setFormTakenAt] = useState(new Date().toISOString().slice(0, 10))

  const load = useCallback(async (patientId: string) => {
    setLoading(true)
    try {
      const params = patientId && patientId !== "all" ? `?patientId=${encodeURIComponent(patientId)}` : ""
      const res = await fetch(`/api/app/radiographs${params}`)
      const data = await res.json()
      if (res.ok) setItems(data.radiographs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(patientFilter)
  }, [patientFilter, load])

  const onUpload = async () => {
    if (!file || !formPatient || saving) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("patientId", formPatient)
      fd.append("examType", formExam)
      if (formLabel.trim()) fd.append("label", formLabel.trim())
      if (formNotes.trim()) fd.append("notes", formNotes.trim())
      if (formTakenAt) fd.append("takenAt", formTakenAt)

      const res = await fetch("/api/app/radiographs", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast(data?.error ?? "Erro ao enviar arquivo.", "error")
        return
      }
      toast("Radiografia enviada com sucesso.", "success")
      setUploadOpen(false)
      setFile(null)
      setFormLabel("")
      setFormNotes("")
      if (patientFilter === "all") setPatientFilter(formPatient)
      else load(patientFilter)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!deleting) return
    const res = await fetch(`/api/app/radiographs/${deleting.id}`, { method: "DELETE" })
    if (res.ok) {
      toast("Radiografia removida.", "success")
      setDeleting(null)
      load(patientFilter)
    } else {
      toast("Erro ao remover.", "error")
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Radiografias <span className="text-gradient">({items.length})</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Exames e imagens dos pacientes da clínica.</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-1.5">
          <FileUp className="h-4 w-4" /> Enviar radiografia
        </Button>
      </div>

      <div className="anim-fade-up flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-[#1c2942] bg-[#0a1120] px-3.5 py-2.5 sm:max-w-md">
          <Stethoscope className="h-4 w-4 shrink-0 text-slate-500" />
          <Select
            value={patientFilter}
            onChange={(e) => setPatientFilter(e.target.value)}
            className="border-0 bg-transparent p-0 focus:ring-0"
          >
            <option value="all">Todos os pacientes</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-[#16213a] bg-[#0b1220]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="inbox"
              title="Nenhuma radiografia"
              description="Envie a primeira radiografia de um paciente para começar."
              action={
                <Button onClick={() => setUploadOpen(true)} className="gap-1.5">
                  <FileUp className="h-4 w-4" /> Enviar radiografia
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((r) => (
            <Card key={r.id} className="anim-fade-up group overflow-hidden">
              <button
                onClick={() => setViewing(r)}
                className="block aspect-[4/3] w-full bg-[#0b1220]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.url}
                  alt={r.label || r.patient.fullName}
                  className="h-full w-full object-cover transition group-hover:opacity-90"
                />
              </button>
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {r.label || EXAM_TYPES.find((t) => t.value === r.examType)?.label || r.examType}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{r.patient.fullName}</p>
                  </div>
                  <button
                    onClick={() => setDeleting(r)}
                    className="rounded-lg p-1.5 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-600">
                  <CalendarDays className="h-3 w-3" /> {formatDate(r.takenAt)}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Upload */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Enviar radiografia"
        subtitle="Formatos aceitos: JPEG, PNG, WebP, GIF, BMP, TIFF, DICOM, PDF (até 25MB)"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={onUpload} loading={saving} disabled={!file || !formPatient}>
              <FileUp className="h-4 w-4" /> Enviar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Arquivo" required>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#23345a] bg-[#0a1120] px-4 py-8 text-sm text-slate-400 transition hover:border-sky-600/50 hover:text-sky-300">
              <Camera className="h-8 w-8 text-slate-600" />
              {file ? (
                <span className="max-w-full truncate text-sky-300">{file.name}</span>
              ) : (
                <span>Clique para selecionar o arquivo</span>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/*,.pdf,.dcm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Paciente" required>
              <Select value={formPatient} onChange={(e) => setFormPatient(e.target.value)}>
                <option value="">Selecione...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo de exame">
              <Select value={formExam} onChange={(e) => setFormExam(e.target.value)}>
                {EXAM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Data do exame">
            <Input type="date" value={formTakenAt} onChange={(e) => setFormTakenAt(e.target.value)} />
          </Field>

          <Field label="Identificação (opcional)">
            <Input value={formLabel} onChange={(e) => setFormLabel(e.target.value)} placeholder="Ex.: Panorâmica inicial" />
          </Field>

          <Field label="Observações (opcional)">
            <Textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Anotações clínicas sobre o exame..."
            />
          </Field>
        </div>
      </Modal>

      {/* Visualizar */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.label || "Radiografia"}
        subtitle={viewing ? `${viewing.patient.fullName} • ${formatDate(viewing.takenAt)}` : undefined}
        size="xl"
        footer={
          <Button variant="ghost" onClick={() => setViewing(null)}>
            Fechar
          </Button>
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[#16213a] bg-[#0a1120]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewing.url} alt={viewing.label || "Radiografia"} className="max-h-[60vh] w-full object-contain" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tipo de exame</p>
                <p className="mt-1 text-sm text-slate-200">
                  {EXAM_TYPES.find((t) => t.value === viewing.examType)?.label || viewing.examType}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tamanho do arquivo</p>
                <p className="mt-1 text-sm text-slate-200">{(viewing.sizeBytes / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            {viewing.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Observações</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{viewing.notes}</p>
              </div>
            )}
            {viewing.reportConclusion && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-300">Conclusão do laudo</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-emerald-100">{viewing.reportConclusion}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        title="Excluir radiografia"
        message={`Remover a radiografia de ${deleting?.patient.fullName ?? "este paciente"}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
