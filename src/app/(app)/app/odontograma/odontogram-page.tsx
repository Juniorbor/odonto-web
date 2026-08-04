"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, RotateCcw, Smile } from "lucide-react"
import { Card, CardBody, Badge } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Input, Select } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { EmptyState } from "@/components/ui/feedback"

type OdontoPatient = { id: string; fullName: string }
type ToothCond = { id: string; toothNumber: number; surface: string; condition: string; note: string | null }

const CONDITIONS: { value: string; label: string; color: string; bg: string }[] = [
  { value: "CARIE", label: "Cárie", color: "text-amber-300", bg: "bg-amber-500/20 border-amber-500/50" },
  { value: "OBTURADO", label: "Obturado", color: "text-emerald-300", bg: "bg-emerald-500/20 border-emerald-500/50" },
  { value: "COROA", label: "Coroa", color: "text-sky-300", bg: "bg-sky-500/20 border-sky-500/50" },
  { value: "EXTRAIDO", label: "Extraído", color: "text-rose-300", bg: "bg-rose-500/20 border-rose-500/50" },
  { value: "FRATURADO", label: "Fraturado", color: "text-orange-300", bg: "bg-orange-500/20 border-orange-500/50" },
  { value: "RAIZ", label: "Raiz", color: "text-violet-300", bg: "bg-violet-500/20 border-violet-500/50" },
  { value: "IMPLANTE", label: "Implante", color: "text-cyan-300", bg: "bg-cyan-500/20 border-cyan-500/50" },
]

const COND_MAP: Record<string, { color: string; bg: string }> = Object.fromEntries(
  CONDITIONS.map((c) => [c.value, { color: c.color, bg: c.bg }]),
)

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

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
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [conditionForm, setConditionForm] = useState({ condition: "CARIE", surface: "WHOLE", note: "" })

  const load = async (pid: string) => {
    if (!pid) {
      setConditions([])
      return
    }
    setLoading(true)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      note: existing?.note ?? "",
    })
  }

  const saveCondition = async () => {
    if (!patientId || selectedTooth === null) return
    setSaving(true)
    try {
      const res = await fetch("/api/app/odontogram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, toothNumber: selectedTooth, ...conditionForm }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      toast("Condição registrada.", "success")
      setSelectedTooth(null)
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
      load(patientId)
    } catch (e) {
      toast((e as Error).message, "error")
    }
  }

  const Tooth = ({ n }: { n: number }) => {
    const c = condFor(n)
    const style = c
      ? COND_MAP[c.condition]
      : { color: "text-slate-500", bg: "border-[#23345a] bg-[#0a1120]" }
    return (
      <button
        onClick={() => selectTooth(n)}
        className={`flex h-9 w-7 items-center justify-center rounded-md border text-[11px] font-bold transition hover:-translate-y-0.5 ${style.bg} ${style.color}`}
        title={`Dente ${n}`}
      >
        {n}
      </button>
    )
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
            <Select value={patientId} onChange={(e) => { setPatientId(e.target.value); setSelectedTooth(null) }}>
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
                  <div>
                    <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-600">Superior</p>
                    <div className="mx-auto grid max-w-xl grid-cols-8 gap-1.5">
                      {UPPER.map((n) => <Tooth key={n} n={n} />)}
                    </div>
                  </div>
                  <div className="mx-auto h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-[#23345a] to-transparent" />
                  <div>
                    <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-slate-600">Inferior</p>
                    <div className="mx-auto grid max-w-xl grid-cols-8 gap-1.5">
                      {LOWER.map((n) => <Tooth key={n} n={n} />)}
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <span key={c.value} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${c.bg} ${c.color}`}>
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
                    <Select value={conditionForm.condition} onChange={(e) => setConditionForm({ ...conditionForm, condition: e.target.value })}>
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