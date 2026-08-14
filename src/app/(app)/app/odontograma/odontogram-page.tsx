"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Paintbrush, Eraser, Save, X as XIcon, CircleDot } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Select } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { EmptyState } from "@/components/ui/feedback"
import { OdontogramArch, type DrawTool, type DotSize, DOT_SIZE_LABELS, type OdontoCondition } from "./odontogram-teeth"

type OdontoPatient = { id: string; fullName: string }

const DOT_SIZES: DotSize[] = ["S", "M", "L"]

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
  const [conditions, setConditions] = useState<OdontoCondition[]>([])
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const baselineRef = useRef<OdontoCondition[]>([])
  const [tool, setTool] = useState<DrawTool | null>(null)
  const [dotSize, setDotSize] = useState<DotSize>("M")

  const load = async (pid: string) => {
    if (!pid) return
    try {
      const res = await fetch(`/api/app/odontogram?patientId=${pid}`)
      const data = await res.json()
      if (res.ok) {
        const list: OdontoCondition[] = data.odontogram?.conditions ?? []
        setConditions(list)
        baselineRef.current = list
        setDirty(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(patientId)
  }, [patientId])

  const findMark = (tooth: number, surface: string) =>
    conditions.find((c) => c.toothNumber === tooth && c.surface === surface && c.shape && c.shape !== "NONE")

  const applyMark = (tooth: number, surface: string) => {
    if (!patientId) return
    if (!tool) {
      toast("Escolha uma ferramenta: X (ausente) ou ponto (cárie).", "info")
      return
    }
    const existing = findMark(tooth, surface)
    if (existing && existing.shape === tool) {
      setConditions((cs) => cs.filter((c) => c.id !== existing.id))
      setDirty(true)
      return
    }
    if (existing) {
      setConditions((cs) =>
        cs.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                condition: tool === "X" ? "EXTRAIDO" : "CARIE",
                shape: tool,
                size: tool === "DOT" ? dotSize : c.size,
                color: tool === "DOT" ? "#ff0000" : c.color,
              }
            : c,
        ),
      )
      setDirty(true)
      return
    }
    setConditions((cs) => [
      ...cs,
      {
        id: `tmp-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        toothNumber: tooth,
        surface,
        condition: tool === "X" ? "EXTRAIDO" : "CARIE",
        shape: tool,
        size: tool === "DOT" ? dotSize : "M",
        color: tool === "DOT" ? "#ff0000" : null,
      },
    ])
    setDirty(true)
  }

  const saveAll = async (): Promise<boolean> => {
    if (!patientId) return true
    const baseline = baselineRef.current
    const current = conditions
    const baselineIds = new Set(baseline.map((c) => c.id))
    const currentIds = new Set(current.map((c) => c.id))
    const adds = current.filter((c) => !baselineIds.has(c.id))
    const removes = baseline.filter((c) => !currentIds.has(c.id)).map((c) => c.id)
    const updates = current.filter((c) => {
      if (!baselineIds.has(c.id)) return false
      const b = baseline.find((x) => x.id === c.id)!
      return b.shape !== c.shape || b.condition !== c.condition || b.size !== c.size || b.color !== c.color
    })
    if (adds.length === 0 && removes.length === 0 && updates.length === 0) {
      setDirty(false)
      return true
    }
    setSaving(true)
    try {
      const res = await fetch("/api/app/odontogram/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, adds, updates, removes }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        created?: { tempId: string; id: string }[]
      }
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      const idMap = new Map((data.created ?? []).map((c) => [c.tempId, c.id]))
      const next = current.map((c) => (idMap.has(c.id) ? { ...c, id: idMap.get(c.id)! } : c))
      baselineRef.current = next
      setConditions(next)
      setDirty(false)
      toast("Odontograma salvo.", "success")
      router.refresh()
      return true
    } catch (e) {
      toast((e as Error).message, "error")
      return false
    } finally {
      setSaving(false)
    }
  }

  const changePatient = async (pid: string) => {
    if (pid === patientId) return
    if (dirty) {
      const ok = await saveAll()
      if (!ok) return
    }
    setPatientId(pid)
    setSelectedTooth(null)
    setConditions([])
    baselineRef.current = []
    setDirty(false)
  }

  const selectTooth = (tooth: number) => {
    if (!patientId) {
      toast("Selecione um paciente primeiro.", "error")
      return
    }
    setSelectedTooth(tooth)
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">
          Odontograma <span className="text-gradient">digital</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Clique nos quadrados de cada dente para marcar ausência (X) ou cárie (ponto) e depois salve tudo de uma vez.</p>
      </div>

      <Card className="anim-fade-up">
        <CardBody>
          <Field label="Paciente">
            <Select value={patientId} onChange={(e) => { void changePatient(e.target.value) }}>
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
        <Card className="anim-fade-up">
          <CardBody>
            {/* controle de desenho */}
            <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-[#23345a] bg-[#0d1526] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Ferramenta</span>
                <Button
                  size="sm"
                  variant={tool === "X" ? "primary" : "subtle"}
                  onClick={() => setTool(tool === "X" ? null : "X")}
                  className={tool === "X" ? "" : "text-slate-300"}
                >
                  <XIcon className="h-4 w-4" /> Ausente
                </Button>
                <Button
                  size="sm"
                  variant={tool === "DOT" ? "primary" : "subtle"}
                  onClick={() => setTool(tool === "DOT" ? null : "DOT")}
                  className={tool === "DOT" ? "" : "text-slate-300"}
                >
                  <CircleDot className="h-4 w-4" /> Cárie
                </Button>
                <Button size="sm" variant="ghost" className="text-slate-400" onClick={() => setTool(null)} title="Nenhuma ferramenta">
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>

              {tool === "DOT" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Tamanho do ponto</span>
                  {DOT_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDotSize(s)}
                      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition ${
                        dotSize === s
                          ? "border-sky-400/70 bg-sky-500/20 text-sky-300"
                          : "border-[#2a3c66] bg-transparent text-slate-400 hover:border-sky-500/40"
                      }`}
                    >
                      <span
                        className="rounded-full bg-rose-500"
                        style={{ width: dotRadiusPx(s), height: dotRadiusPx(s) }}
                      />
                      {DOT_SIZE_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}

              <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500">
                <Paintbrush className="h-3.5 w-3.5" />
                {tool === "X"
                  ? "Clique nos quadrados (M/D/V/L/O) para marcar ausente. Clique de novo para remover. Salve ao finalizar."
                  : tool === "DOT"
                    ? "Clique nos quadrados para marcar o ponto de cárie. Clique de novo para remover. Salve ao finalizar."
                    : "Escolha uma ferramenta acima para começar a desenhar nos quadrados."}
              </div>
            </div>

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
                    tool={tool}
                    onSelect={selectTooth}
                    onSquareClick={applyMark}
                  />
                </div>
                <p className="text-center text-[11px] text-slate-600">
                  Passe o mouse sobre um dente e clique no quadrado da superfície para marcar X (ausente) ou ponto (cárie),
                  com o tamanho escolhido. Ao terminar, clique em &quot;Salvar odontograma&quot;.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#16213a] pt-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <span>Marcas:</span>
                <span className="inline-flex items-center gap-1">
                  <svg width="12" height="12" className="inline-block"><line x1="2" y1="2" x2="10" y2="10" stroke="#0052ff" strokeWidth="1.6" /><line x1="10" y1="2" x2="2" y2="10" stroke="#0052ff" strokeWidth="1.6" /></svg>
                  X = ausente
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Ponto = cárie
                </span>
              </div>
              <span className="text-[11px] text-slate-600">
                {conditions.filter((c) => c.shape && c.shape !== "NONE").length} marca(s)
              </span>
              <div className="flex items-center gap-2">
                {dirty && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                    Alterações não salvas
                  </span>
                )}
                <Button onClick={() => void saveAll()} disabled={!dirty || saving} loading={saving} size="sm">
                  <Save className="h-3.5 w-3.5" /> Salvar odontograma
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
      {saving && (
        <div className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-xl bg-slate-900/90 px-3 py-2 text-xs text-slate-300 shadow-xl backdrop-blur">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando...
        </div>
      )}
    </div>
  )
}

function dotRadiusPx(size: DotSize): number {
  if (size === "S") return 6
  if (size === "L") return 12
  return 9
}