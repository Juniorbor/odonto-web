"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { FileText, FilePlus2, Trash2, Eye, Pencil, Stethoscope } from "lucide-react"
import { Card, CardBody, Badge } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/feedback"
import { Button } from "@/components/ui/button"
import { Input, Textarea, Select, Field } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { formatDate } from "@/lib/utils"

const DOC_TYPES = [
  { value: "TERMO", label: "Termo" },
  { value: "CONSENTIMENTO", label: "Consentimento" },
  { value: "ANAMNESE", label: "Anamnese" },
  { value: "RELATORIO", label: "Relatório" },
  { value: "ORIENTACOES", label: "Orientações" },
  { value: "PERSONALIZADO", label: "Personalizado" },
]

type DocumentRow = {
  id: string
  patientId: string | null
  patient: { id: string; fullName: string } | null
  type: string
  typeLabel: string
  title: string
  content: string
  signedByName: string | null
  createdAt: string
  updatedAt: string
}

export function DocumentsPage({ patients }: { patients: { id: string; fullName: string }[] }) {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [items, setItems] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [patientFilter, setPatientFilter] = useState(searchParams.get("patientId") || "all")

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<DocumentRow | null>(null)
  const [viewing, setViewing] = useState<DocumentRow | null>(null)
  const [deleting, setDeleting] = useState<DocumentRow | null>(null)
  const [saving, setSaving] = useState(false)

  const [formPatient, setFormPatient] = useState(searchParams.get("patientId") || "")
  const [formType, setFormType] = useState("PERSONALIZADO")
  const [formTitle, setFormTitle] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formSigned, setFormSigned] = useState("")

  const load = useCallback(async (patientId: string) => {
    setLoading(true)
    try {
      const params = patientId && patientId !== "all" ? `?patientId=${encodeURIComponent(patientId)}` : ""
      const res = await fetch(`/api/app/documents${params}`)
      const data = await res.json()
      if (res.ok) setItems(data.documents)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(patientFilter)
  }, [patientFilter, load])

  const openNew = () => {
    setEditing(null)
    setFormPatient(searchParams.get("patientId") || "")
    setFormType("PERSONALIZADO")
    setFormTitle("")
    setFormContent("")
    setFormSigned("")
    setFormOpen(true)
  }

  const openEdit = (d: DocumentRow) => {
    setEditing(d)
    setFormPatient(d.patientId ?? "")
    setFormType(d.type)
    setFormTitle(d.title)
    setFormContent(d.content)
    setFormSigned(d.signedByName ?? "")
    setFormOpen(true)
  }

  const onSave = async () => {
    if (!formTitle.trim() || saving) return
    setSaving(true)
    try {
      const payload = {
        patientId: formPatient || undefined,
        type: formType,
        title: formTitle.trim(),
        content: formContent,
        signedByName: formSigned.trim() || undefined,
      }
      const res = editing
        ? await fetch(`/api/app/documents/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/app/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) {
        toast(data?.error ?? "Erro ao salvar documento.", "error")
        return
      }
      toast(editing ? "Documento atualizado." : "Documento criado com sucesso.", "success")
      setFormOpen(false)
      load(patientFilter)
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async () => {
    if (!deleting) return
    const res = await fetch(`/api/app/documents/${deleting.id}`, { method: "DELETE" })
    if (res.ok) {
      toast("Documento removido.", "success")
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
            Documentos <span className="text-gradient">({items.length})</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Termos, consentimentos, orientações e relatórios.</p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <FilePlus2 className="h-4 w-4" /> Novo documento
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl border border-[#16213a] bg-[#0b1220]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="file"
              title="Nenhum documento"
              description="Crie termos de consentimento, orientações e relatórios."
              action={
                <Button onClick={openNew} className="gap-1.5">
                  <FilePlus2 className="h-4 w-4" /> Novo documento
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <Card key={d.id} className="anim-fade-up">
              <CardBody>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600/40 to-cyan-500/40 text-sky-300">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => setViewing(d)} className="truncate text-sm font-semibold text-slate-100 transition hover:text-sky-300">
                        {d.title}
                      </button>
                      <Badge tone="primary">{d.typeLabel}</Badge>
                      {d.signedByName && <Badge tone="success">Assinado: {d.signedByName}</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {d.patient?.fullName ?? "Sem paciente vinculado"} • criado em {formatDate(d.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewing(d)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-sky-300"
                      aria-label="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(d)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-sky-300"
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(d)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Form */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar documento" : "Novo documento"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={onSave} loading={saving} disabled={!formTitle.trim()}>
              {editing ? "Salvar alterações" : "Criar documento"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título" required>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex.: Termo de consentimento" />
            </Field>
            <Field label="Tipo">
              <Select value={formType} onChange={(e) => setFormType(e.target.value)}>
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Paciente (opcional)">
            <Select value={formPatient} onChange={(e) => setFormPatient(e.target.value)}>
              <option value="">Sem paciente vinculado</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Conteúdo" hint="Texto livre do documento.">
            <Textarea rows={8} value={formContent} onChange={(e) => setFormContent(e.target.value)} />
          </Field>

          <Field label="Assinatura (nome por extenso, opcional)">
            <Input value={formSigned} onChange={(e) => setFormSigned(e.target.value)} placeholder="Nome de quem assina" />
          </Field>
        </div>
      </Modal>

      {/* Visualizar */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.title}
        subtitle={viewing ? `${viewing.patient?.fullName ?? "Sem paciente"} • ${formatDate(viewing.createdAt)}` : undefined}
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setViewing(null)}>
            Fechar
          </Button>
        }
      >
        {viewing && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">{viewing.typeLabel}</Badge>
              {viewing.signedByName && <Badge tone="success">Assinado: {viewing.signedByName}</Badge>}
            </div>
            <div className="rounded-2xl border border-[#16213a] bg-[#0a1120] p-5">
              {viewing.content ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{viewing.content}</p>
              ) : (
                <p className="text-sm text-slate-500">Documento sem conteúdo textual.</p>
              )}
            </div>
            <p className="text-[11px] text-slate-600">Última atualização: {formatDate(viewing.updatedAt, true)}</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        title="Excluir documento"
        message={`Remover "${deleting?.title ?? "este documento"}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
