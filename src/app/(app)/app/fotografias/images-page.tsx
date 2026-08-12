"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Camera, CalendarDays, Trash2, Stethoscope, Pencil, Link2 } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/feedback"
import { Button } from "@/components/ui/button"
import { Input, Textarea, Select, Field } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { formatDate } from "@/lib/utils"
import { EXTRAORAL_LABELS, INTRAORAL_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { uploadWithChunks, formatBytes, CLIENT_MAX_UPLOAD } from "@/lib/client-upload"

const CATEGORY_TABS = [
  { value: "all", label: "Todas" },
  { value: "EXTRAORAL", label: "Extrabucal" },
  { value: "INTRAORAL", label: "Intrabucal" },
]

type ImageRow = {
  id: string
  kind?: "image" | "radiograph"
  patientId: string
  patient: { id: string; fullName: string }
  category: string
  label: string | null
  mimeType: string
  sizeBytes: number
  takenAt: string
  notes: string | null
  url: string
}

export function ImagesPage({ patients }: { patients: { id: string; fullName: string }[] }) {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [items, setItems] = useState<ImageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [patientFilter, setPatientFilter] = useState(searchParams.get("patientId") || "all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const [uploadOpen, setUploadOpen] = useState(false)
  const [viewing, setViewing] = useState<ImageRow | null>(null)
  const [editing, setEditing] = useState<ImageRow | null>(null)
  const [deleting, setDeleting] = useState<ImageRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const captureInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [formPatient, setFormPatient] = useState("")
  const [formCategory, setFormCategory] = useState("INTRAORAL")
  const [formLabel, setFormLabel] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const openUpload = () => {
    setUploadOpen(true)
    setFile(null)
    setFormPatient(patientFilter !== "all" ? patientFilter : searchParams.get("patientId") || "")
    setFormLabel("")
    setFormNotes("")
  }
  const [formTakenAt, setFormTakenAt] = useState(new Date().toISOString().slice(0, 10))

  const [editCategory, setEditCategory] = useState("INTRAORAL")
  const [editLabel, setEditLabel] = useState("")
  const [editNotes, setEditNotes] = useState("")

  const load = useCallback(async (patientId: string, category: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (patientId && patientId !== "all") params.set("patientId", patientId)
      if (category && category !== "all") params.set("category", category)
      const qs = params.toString()
      const res = await fetch(`/api/app/images${qs ? `?${qs}` : ""}`)
      const data = await res.json()
      if (res.ok) setItems(data.images)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(patientFilter, categoryFilter)
  }, [patientFilter, categoryFilter, load])

  const onUpload = async () => {
    if (!file || !formPatient || saving) return
    if (file.size > CLIENT_MAX_UPLOAD) {
      toast("Arquivo excede o limite de 25MB.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await uploadWithChunks("/api/app/images", file, () => ({
        patientId: formPatient,
        category: formCategory,
        label: formLabel.trim(),
        notes: formNotes.trim(),
        takenAt: formTakenAt,
      }))
      if (!res.ok) {
        toast(res.error ?? "Erro ao enviar arquivo.", "error")
        return
      }
      toast("Fotografia enviada com sucesso.", "success")
      setUploadOpen(false)
      setFile(null)
      setFormLabel("")
      setFormNotes("")
      if (patientFilter === "all") setPatientFilter(formPatient)
      else load(patientFilter, categoryFilter)
    } finally {
      setSaving(false)
    }
  }

  const onCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const patientId = patientFilter !== "all" ? patientFilter : searchParams.get("patientId") || ""
    if (!patientId) {
      toast("Selecione o paciente no filtro acima antes de tirar a foto.", "error")
      return
    }
    setCapturing(true)
    try {
      const res = await uploadWithChunks("/api/app/images", file, () => ({
        patientId,
        category: categoryFilter === "EXTRAORAL" ? "EXTRAORAL" : "INTRAORAL",
        takenAt: new Date().toISOString().slice(0, 10),
      }))
      if (!res.ok) {
        toast(res.error ?? "Erro ao enviar a foto.", "error")
        return
      }
      toast("Foto tirada e enviada com sucesso.", "success")
      load(patientFilter, categoryFilter)
    } finally {
      setCapturing(false)
    }
  }

  const onEdit = async () => {
    if (!editing || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/app/images/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editCategory,
          label: editLabel,
          notes: editNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data?.error ?? "Erro ao salvar.", "error")
        return
      }
      toast("Fotografia atualizada.", "success")
      setEditing(null)
      load(patientFilter, categoryFilter)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!deleting) return
    const url = deleting.kind === "radiograph" ? `/api/app/radiographs/${deleting.id}` : `/api/app/images/${deleting.id}`
    const res = await fetch(url, { method: "DELETE" })
    if (res.ok) {
      toast(deleting.kind === "radiograph" ? "Radiografia removida." : "Fotografia removida.", "success")
      setDeleting(null)
      load(patientFilter, categoryFilter)
    } else {
      toast("Erro ao remover.", "error")
    }
  }

  const openEdit = (row: ImageRow) => {
    setEditing(row)
    setEditCategory(row.category)
    setEditLabel(row.label ?? "")
    setEditNotes(row.notes ?? "")
  }

  const suggestions = formCategory === "EXTRAORAL" ? EXTRAORAL_LABELS : INTRAORAL_LABELS

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Fotografias <span className="text-gradient">({items.length})</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Fotos clínicas extra e intrabucais dos pacientes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => captureInputRef.current?.click()}
            loading={capturing}
            disabled={patientFilter === "all"}
            title={patientFilter === "all" ? "Selecione um paciente no filtro para tirar foto" : "Tirar foto com a câmera"}
            className="gap-1.5"
          >
            <Camera className="h-4 w-4" /> Tirar foto
          </Button>
          <Button onClick={openUpload} className="gap-1.5">
            <Camera className="h-4 w-4" /> Enviar fotografia
          </Button>
        </div>
        <input
          ref={captureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onCapture}
        />
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

        <div className="flex items-center gap-1 rounded-xl border border-[#1c2942] bg-[#0a1120] p-1">
          {CATEGORY_TABS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-xs font-medium transition",
                categoryFilter === c.value ? "bg-sky-500/15 text-sky-300" : "text-slate-500 hover:text-slate-300",
              )}
            >
              {c.label}
            </button>
          ))}
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
              title="Nenhuma fotografia"
              description="Envie a primeira foto clínica de um paciente para começar."
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((img) => (
            <Card key={img.id} className="anim-fade-up group overflow-hidden">
              <button onClick={() => setViewing(img)} className="block aspect-[4/3] w-full bg-[#0b1220]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.label || img.patient.fullName}
                  className="h-full w-full object-contain transition group-hover:opacity-90"
                />
              </button>
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {img.label ||
                        (img.kind === "radiograph"
                          ? "Radiografia"
                          : img.category === "EXTRAORAL"
                            ? "Foto extrabucal"
                            : "Foto intrabucal")}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{img.patient.fullName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {img.kind !== "radiograph" && (
                      <button
                        onClick={() => openEdit(img)}
                        className="rounded-lg p-1.5 text-slate-600 transition hover:bg-sky-500/10 hover:text-sky-300"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleting(img)}
                      className="rounded-lg p-1.5 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-600">
                  <CalendarDays className="h-3 w-3" /> {formatDate(img.takenAt)}
                  <span className="mx-1">•</span>
                  <span className={img.kind === "radiograph" ? "text-sky-400" : img.category === "EXTRAORAL" ? "text-cyan-400" : "text-violet-400"}>
                    {img.kind === "radiograph" ? "Radiografia" : img.category === "EXTRAORAL" ? "Extrabucal" : "Intrabucal"}
                  </span>
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
        title="Enviar fotografia"
        subtitle="Formatos aceitos: JPEG, PNG, WebP, GIF, BMP, TIFF (até 25MB)"
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={onUpload} loading={saving} disabled={!file || !formPatient}>
              <Camera className="h-4 w-4" /> Enviar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Arquivo" required>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#23345a] bg-[#0a1120] px-4 py-8 text-sm text-slate-400 transition hover:border-sky-600/50 hover:text-sky-300">
              <Camera className="h-8 w-8 text-slate-600" />
              {file ? (
                <span className="flex max-w-full flex-col items-center gap-0.5 text-center">
                  <span className="max-w-full truncate text-sky-300">{file.name}</span>
                  <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                </span>
              ) : (
                <span>Clique para selecionar a foto</span>
              )}
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
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
            <Field label="Categoria">
              <Select value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                <option value="INTRAORAL">Intrabucal</option>
                <option value="EXTRAORAL">Extrabucal</option>
              </Select>
            </Field>
          </div>

          {formPatient && (
            <div className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-sm text-sky-200">
              <Camera className="h-4 w-4 shrink-0 text-sky-400" />
              <span>
                Enviando para: <strong>{patients.find((p) => p.id === formPatient)?.fullName}</strong>
              </span>
            </div>
          )}

          <Field label="Identificação (opcional)">
            <Input
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder={formCategory === "EXTRAORAL" ? "Ex.: Frente, Perfil direito..." : "Ex.: Frontal, Oclusal superior..."}
            />
          </Field>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setFormLabel(s)}
                  className={cn(
                    "rounded-full border border-[#23345a] px-3 py-1 text-[11px] text-slate-400 transition hover:border-sky-600/50 hover:text-sky-300",
                    formLabel === s && "border-sky-500/60 bg-sky-500/10 text-sky-300",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <Field label="Data da foto">
            <Input type="date" value={formTakenAt} onChange={(e) => setFormTakenAt(e.target.value)} />
          </Field>

          <Field label="Observações (opcional)">
            <Textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Anotações clínicas sobre a foto..."
            />
          </Field>
        </div>
      </Modal>

      {/* Visualizar */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.label || (viewing?.kind === "radiograph" ? "Radiografia" : "Fotografia")}
        subtitle={viewing ? `${viewing.patient.fullName} • ${formatDate(viewing.takenAt)}` : undefined}
        size="xl"
        footer={
          <div className="flex w-full items-center justify-between">
            <a
              href={viewing?.url ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-300 transition hover:text-sky-200"
            >
              <Link2 className="h-3.5 w-3.5" /> Abrir em nova aba
            </a>
            <Button variant="ghost" onClick={() => setViewing(null)}>
              Fechar
            </Button>
          </div>
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[#16213a] bg-[#0a1120]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewing.url} alt={viewing.label || "Fotografia"} className="max-h-[60vh] w-full object-contain" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Categoria</p>
                <p className="mt-1 text-sm text-slate-200">
                  {viewing.kind === "radiograph"
                    ? "Radiografia (extrabucal)"
                    : viewing.category === "EXTRAORAL"
                      ? "Extrabucal"
                      : "Intrabucal"}
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
          </div>
        )}
      </Modal>

      {/* Editar */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar fotografia"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={onEdit} loading={saving}>
              <Pencil className="h-4 w-4" /> Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Categoria">
            <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
              <option value="INTRAORAL">Intrabucal</option>
              <option value="EXTRAORAL">Extrabucal</option>
            </Select>
          </Field>
          <Field label="Identificação">
            <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
          </Field>
          <Field label="Observações">
            <Textarea rows={3} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        title={deleting?.kind === "radiograph" ? "Excluir radiografia" : "Excluir fotografia"}
        message={
          deleting?.kind === "radiograph"
            ? `Remover a radiografia de ${deleting?.patient.fullName ?? "este paciente"}? Esta ação não pode ser desfeita.`
            : `Remover a foto de ${deleting?.patient.fullName ?? "este paciente"}? Esta ação não pode ser desfeita.`
        }
        confirmLabel="Excluir"
      />
    </div>
  )
}