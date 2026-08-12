"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Paintbrush, Eraser, X as XIcon, CircleDot } from "lucide-react"
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
  const [tool, setTool] = useState<DrawTool | null>(null)
  const [dotSize, setDotSize] = useState<DotSize>("M")

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

  const findMark = (tooth: number, surface: string) =>
    conditions.find((c) => c.toothNumber === tooth && c.surface === surface && c.shape && c.shape !== "NONE")

  const refresh = async () => {
    setLoading(true)
    await load(patientId)
    router.refresh()
  }

  const applyMark = async (tooth: number, surface: string) => {
    if (!patientId) return
    if (!tool) {
      toast("Escolha uma ferramenta: X (ausente) ou ponto (cárie).", "info")
      return
    }
    const existing = findMark(tooth, surface)
    setSaving(true)
    try {
      if (existing && existing.shape === tool) {
        const res = await fetch(`/api/app/odontogram/${existing.id}`, { method: "DELETE" })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erro ao remover.")
        await refresh()
        return
      }

      const payload = {
        toothNumber: tooth,
        surface,
        condition: tool === "X" ? "EXTRAIDO" : "CARIE",
        shape: tool,
        size: tool === "DOT" ? dotSize : undefined,
        color: tool === "DOT" ? "#ff0000" : undefined,
      }

      if (existing) {
        const res = await fetch(`/api/app/odontogram/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erro ao atualizar.")
      } else {
        const res = await fetch("/api/app/odontogram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId, ...payload }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erro ao registrar.")
      }
      toast(tool === "X" ? "Dente ausente marcado." : "Cárie marcada.", "success")
      await refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
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
        <p className="mt-1 text-sm text-slate-500">Clique nos quadrados de cada dente para marcar ausência (X) ou cárie (ponto).</p>
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
                  ? "Clique nos quadrados (M/D/V/L/O) para marcar ausente. Clique de novo para remover."
                  : tool === "DOT"
                    ? "Clique nos quadrados para marcar o ponto de cárie. Clique de novo para remover."
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
                  com o tamanho escolhido.
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
                {conditions.filter((c) => c.shape && c.shape !== "NONE").length} marca(s) registrada(s)
              </span>
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