"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RotateCcw, Smile } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Input, Select } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { EmptyState } from "@/components/ui/feedback"
import { OdontogramArch } from "./odontogram-teeth"

type OdontoPatient = { id: string; fullName: string }
type ToothCond = { id: string; toothNumber: number; surface: string; condition: string; shape: string; color: string | null; note: string | null }

const CONDITIONS: { value: string; label: string; hex: string; color: string; bg: string }[] = [
  { value: "CARIE", label: "Cárie", hex: "#f59e0b", color: "text-amber-300", bg: "bg-amber-500/20 border-amber-500/50" },
  { value: "OBTURADO", label: "Obturado", hex: "#10b981", color: "text-emerald-300", bg: "bg-emerald-500/20 border-emerald-500/50" },
  { value: "COROA", label: "Coroa", hex: "#0ea5e9", color: "text-sky-300", bg: "bg-sky-500/20 border-sky-500/50" },
  { value: "EXTRAIDO", label: "Extraído", hex: "#f43f5e", color: "text-rose-300", bg: "bg-rose-500/20 border-rose-500/50" },
  { value: "FRATURADO", label: "Fraturado", hex: "#f97316", color: "text-orange-300", bg: "bg-orange-500/20 border-orange-500/50" },
  { value: "RAIZ", label: "Raiz", hex: "#8b5cf6", color: "text-violet-300", bg: "bg-violet-500/20 border-violet-500/50" },
  { value: "IMPLANTE", label: "Implante", hex: "#06b6d4", color: "text-cyan-300", bg: "bg-cyan-500/20 border-cyan-500/50" },
]

const CONDITION_HEX: Record<string, string> = Object.fromEntries(CONDITIONS.map((c) => [c.value, c.hex]))

const SHAPES: { value: string; label: string }[] = [
  { value: "NONE", label: "Nenhuma" },
  { value: "X", label: "X (Ausente)" },
  { value: "DOT", label: "Ponto (Cárie)" },
]

export function OdontogramPage({
  patients,
  initialPatientId,
}: {
  patients: OdontoPatient[]
  initialPatientId?: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [patientId, setPatientId] = useState(initialPatientId ?? "")
  const [conditions, setConditions] = useState<ToothCond[]>([])
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [conditionForm, setConditionForm] = useState({ condition: "CARIE", surface: "WHOLE", shape: "NONE", color: "", note: "" })

  const load = async (pid: string) => {
    if (!pid) return
    try {
      const res = await fetch(`/api/app/odontogram?patientId=${pid}`)
      const data = await res.json()
      if (res.ok) setConditions(data.odontogram?.conditions ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(patientId)
  }, [patientId])

  const condFor = (tooth: number) => conditions.find((c) => c.toothNumber === tooth)

  const selectTooth = (tooth: number) => {
    if (!patientId) {
      toast("Selecione um paciente primeiro.", "error")
      return
    }
    const existing = condFor(tooth)
    setSelectedTooth(tooth)
    setConditionForm({
      condition: existing?.condition ?? "CARIE",
      surface: existing?.surface ?? "WHOLE",
      shape: existing?.shape ?? "NONE",
      color: existing?.color ?? "",
      note: existing?.note ?? "",
    })
  }

  const saveCondition = async () => {
    if (!patientId || selectedTooth === null) return
    setSaving(true)
    try {
      const existing = condFor(selectedTooth)
      const payload = {
        patientId,
        toothNumber: selectedTooth,
        condition: conditionForm.condition,
        surface: conditionForm.surface,
        shape: conditionForm.shape,
        color: conditionForm.color,
        note: conditionForm.note,
      }
      const res = existing
        ? await fetch(`/api/app/odontogram/${existing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/app/odontogram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      toast(existing ? "Condição atualizada." : "Condição registrada.", "success")
      setSelectedTooth(null)
      setLoading(true)
      load(patientId)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const removeCondition = async (condId: string) => {
    try {
      const res = await fetch(`/api/app/odontogram/${condId}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast("Condição removida.", "info")
      setSelectedTooth(null)
      setLoading(true)
      load(patientId)
    } catch (e) {
      toast((e as Error).message, "error")
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">
          Odontograma <span className="text-gradient">digital</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Registre as condições de cada dente do paciente.</p>
      </div>

      <Card className="anim-fade-up">
        <CardBody>
          <Field label="Paciente">
            <Select value={patientId} onChange={(e) => { setPatientId(e.target.value); setSelectedTooth(null); setConditions([]) }}>
              <option value="">Selecione o paciente</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
            </Select>
          </Field>
        </CardBody>
      </Card>

      {!patientId ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="inbox"
              title="Selecione um paciente"
              description="Escolha o paciente para visualizar e editar o odontograma."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <Card className="anim-fade-up">
            <CardBody>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando odontograma...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative mx-auto w-full max-w-5xl">
                    <OdontogramArch
                      conditions={conditions}
                      selectedTooth={selectedTooth}
                      onSelect={selectTooth}
                    />
                  </div>
                  <p className="text-center text-[11px] text-slate-600">
                    Passe o mouse sobre um dente e clique para registrar a condição. Use X para marcar dente ausente ou Ponto para marcar cárie, com a cor da lesão.
                  </p>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <span key={c.value} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${c.bg} ${c.color}`}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.hex }} />
                    {c.label}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>

          {selectedTooth !== null && (
            <Card className="anim-fade-up">
              <CardBody>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Dente <span className="text-gradient">{selectedTooth}</span>
                    {condFor(selectedTooth) && (
                      <span className="ml-2 text-xs text-slate-500">· condição registrada</span>
                    )}
                  </h3>
                  {condFor(selectedTooth) && (
                    <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => removeCondition(condFor(selectedTooth)!.id)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Remover condição
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Condição">
                    <Select
                      value={conditionForm.condition}
                      onChange={(e) => {
                        const condition = e.target.value
                        setConditionForm((f) => ({ ...f, condition, color: CONDITION_HEX[condition] ?? f.color }))
                      }}
                    >
                      {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Superfície">
                    <Select value={conditionForm.surface} onChange={(e) => setConditionForm({ ...conditionForm, surface: e.target.value })}>
                      <option value="WHOLE">Dente inteiro</option>
                      <option value="O">Oclusal</option>
                      <option value="V">Vestibular</option>
                      <option value="L">Lingual</option>
                      <option value="M">Mesial</option>
                      <option value="D">Distal</option>
                      <option value="P">Palatina</option>
                    </Select>
                  </Field>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Marca no dente (procedimento)">
                    <Select value={conditionForm.shape} onChange={(e) => setConditionForm({ ...conditionForm, shape: e.target.value })}>
                      {SHAPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Cor da marca (baseada na lesão)">
                    <div className="flex flex-wrap items-center gap-2">
                      {CONDITIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.label}
                          onClick={() => setConditionForm({ ...conditionForm, color: c.hex })}
                          className="h-7 w-7 rounded-full border-2 transition hover:scale-110"
                          style={{
                            backgroundColor: c.hex,
                            borderColor: conditionForm.color === c.hex ? "#ffffff" : "rgba(255,255,255,0.15)",
                          }}
                        />
                      ))}
                      {conditionForm.color && (
                        <span className="text-[11px] text-slate-500">#{conditionForm.color.replace("#", "")}</span>
                      )}
                    </div>
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Observação">
                    <Input value={conditionForm.note} onChange={(e) => setConditionForm({ ...conditionForm, note: e.target.value })} placeholder="Detalhes da condição..." />
                  </Field>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={saveCondition} disabled={saving}>
                    <Smile className="h-4 w-4" /> {saving ? "Salvando..." : "Registrar condição"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  )
}