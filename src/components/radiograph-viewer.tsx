"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Circle, Download, FileText, MousePointer2, PenTool, Save, Square, Trash2, Undo2, X, ZoomIn } from "lucide-react"
import { cn, isImageRenderable } from "@/lib/utils"
import { useToast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"

export type ViewerShape =
  | { type: "arrow"; x1: number; y1: number; x2: number; y2: number }
  | { type: "circle"; cx: number; cy: number; rx: number; ry: number }
  | { type: "rect"; x: number; y: number; w: number; h: number }
  | { type: "path"; points: [number, number][] }

type Tool = "arrow" | "circle" | "rect" | "path" | "lupa"

const MAG = 220
const ZOOM = 3.2

const TOOLS: { id: Tool; label: string }[] = [
  { id: "arrow", label: "Seta" },
  { id: "circle", label: "Círculo" },
  { id: "rect", label: "Retângulo" },
  { id: "path", label: "Linha pontilhada" },
  { id: "lupa", label: "Lupa" },
]

const TOOL_ICONS: Record<Tool, typeof Circle> = {
  arrow: MousePointer2,
  circle: Circle,
  rect: Square,
  path: PenTool,
  lupa: ZoomIn,
}

function normalizeLoaded(raw: unknown): ViewerShape | null {
  const r = (raw ?? {}) as Record<string, unknown>
  const asArr = (v: unknown): { x: number; y: number }[] => (Array.isArray(v) ? (v as { x: number; y: number }[]) : [])
  const first = asArr(r.points)[0]
  const px = (v: unknown) => (typeof v === "number" ? v : first?.x ?? 0)
  const py = (v: unknown) => (typeof v === "number" ? v : first?.y ?? 0)
  switch (r.type) {
    case "arrow":
      return {
        type: "arrow",
        x1: px(r.x1),
        y1: py(r.y1),
        x2: px(r.x2),
        y2: py(r.y2),
      }
    case "circle":
      return { type: "circle", cx: px(r.cx), cy: py(r.cy), rx: px(r.rx), ry: py(r.ry) }
    case "rect":
      return { type: "rect", x: px(r.x), y: py(r.y), w: px(r.w), h: py(r.h) }
    case "path":
      return { type: "path", points: (asArr(r.points)).map((p) => [p.x, p.y]) }
    case "pencil": {
      const pts = (asArr(r.points)).map((p) => [p.x, p.y])
      return pts.length >= 2 ? { type: "path", points: pts as [number, number][] } : null
    }
    case "line":
    case "dash":
    case "ellipse":
    case "region":
    case "text":
      return null
    default:
      return null
  }
}

function ShapeSvg({ shape }: { shape: ViewerShape }) {
  if (shape.type === "arrow") {
    const dx = shape.x2 - shape.x1
    const dy = shape.y2 - shape.y1
    const len = Math.hypot(dx, dy) || 1
    const head = 16
    const ang = Math.atan2(dy, dx)
    const bx = shape.x2 - (head * dx) / len
    const by = shape.y2 - (head * dy) / len
    const p1x = bx - (head * Math.sin(ang)) / 2
    const p1y = by + (head * Math.cos(ang)) / 2
    const p2x = bx + (head * Math.sin(ang)) / 2
    const p2y = by - (head * Math.cos(ang)) / 2
    return (
      <g>
        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="#f97316" strokeWidth={3} strokeLinecap="round" />
        <polygon points={`${shape.x2},${shape.y2} ${p1x},${p1y} ${p2x},${p2y}`} fill="#f97316" />
      </g>
    )
  }
  if (shape.type === "circle") {
    return <ellipse cx={shape.cx} cy={shape.cy} rx={Math.max(shape.rx, 1)} ry={Math.max(shape.ry, 1)} fill="none" stroke="#22d3ee" strokeWidth={3} />
  }
  if (shape.type === "rect") {
    return <rect x={Math.min(shape.x, shape.x + shape.w)} y={Math.min(shape.y, shape.y + shape.h)} width={Math.abs(shape.w)} height={Math.abs(shape.h)} fill="none" stroke="#a78bfa" strokeWidth={3} />
  }
  const d = shape.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  return <path d={d} fill="none" stroke="#34d399" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 8" />
}

export function RadiographViewer({
  open,
  onClose,
  radiograph,
  title,
}: {
  open: boolean
  onClose: () => void
  radiograph: { id: string; label: string | null; fileUrl: string; mimeType?: string }
  title?: string
}) {
  const { toast } = useToast()
  const renderable = isImageRenderable(radiograph.mimeType)
  const [tool, setTool] = useState<Tool>("arrow")
  const [shapes, setShapes] = useState<ViewerShape[]>([])
  const [draft, setDraft] = useState<ViewerShape | null>(null)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [snapshots, setSnapshots] = useState<string[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const drawingRef = useRef(false)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const zoomGuardRef = useRef(0)
  const capturePendingRef = useRef(false)
  const shapesRef = useRef<ViewerShape[]>([])
  const dirtyRef = useRef(false)
  const closingRef = useRef(false)
  const savingRef = useRef(false)

  const toImageCoords = useCallback(
    (clientX: number, clientY: number) => {
      const img = imgRef.current
      const box = containerRef.current
      if (!img || !box) return null
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      if (!iw || !ih) return null
      const bw = box.clientWidth
      const bh = box.clientHeight
      const scale = Math.min(bw / iw, bh / ih)
      const rw = iw * scale
      const rh = ih * scale
      const rx = (bw - rw) / 2
      const ry = (bh - rh) / 2
      const rect = box.getBoundingClientRect()
      const px = clientX - rect.left - rx
      const py = clientY - rect.top - ry
      return { x: px / scale, y: py / scale, scale, rw, rh, rx, ry }
    },
    [],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (tool === "lupa") {
      const now = Date.now()
      if (now - zoomGuardRef.current < 350) {
        zoomGuardRef.current = now
        return
      }
      zoomGuardRef.current = now
      captureRegion(e.clientX, e.clientY)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    const c = toImageCoords(e.clientX, e.clientY)
    if (!c) return
    drawingRef.current = true
    startRef.current = { x: c.x, y: c.y }
    if (tool === "path") {
      setDraft({ type: "path", points: [[c.x, c.y]] })
    } else if (tool === "arrow") {
      setDraft({ type: "arrow", x1: c.x, y1: c.y, x2: c.x, y2: c.y })
    } else if (tool === "rect") {
      setDraft({ type: "rect", x: c.x, y: c.y, w: 0, h: 0 })
    } else {
      setDraft({ type: "circle", cx: c.x, cy: c.y, rx: 0, ry: 0 })
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const c = toImageCoords(e.clientX, e.clientY)
    if (tool === "lupa") {
      const box = containerRef.current
      const lens = lensRef.current
      if (box && lens && c && imgRef.current) {
        const rect = box.getBoundingClientRect()
        const lensR = MAG / 2
        const zoom = ZOOM
        lens.style.opacity = "1"
        lens.style.left = `${e.clientX - rect.left - lensR}px`
        lens.style.top = `${e.clientY - rect.top - lensR}px`
        lens.style.backgroundSize = `${c.rw * zoom}px ${c.rh * zoom}px`
        lens.style.backgroundPosition = `${lensR - c.x * zoom}px ${lensR - c.y * zoom}px`
        lens.style.backgroundImage = `url(${radiograph.fileUrl})`
      }
      return
    }
    if (!drawingRef.current || !draft || !c || !startRef.current) return
    const s = startRef.current
    setDraft((prev) => {
      if (!prev || !s) return prev
      if (prev.type === "path") return { ...prev, points: [...prev.points, [c.x, c.y]] }
      if (prev.type === "arrow") return { ...prev, x2: c.x, y2: c.y }
      if (prev.type === "rect") {
        const x = prev.x
        const y = prev.y
        return { ...prev, w: c.x - x, h: c.y - y }
      }
      const r = Math.hypot(c.x - s.x, c.y - s.y)
      return { ...prev, rx: r, ry: r }
    })
  }

  const onPointerUp = () => {
    if (tool === "lupa") return
    if (!drawingRef.current) return
    drawingRef.current = false
    startRef.current = null
    if (draft) {
      setShapes((all) => [...all, draft])
      setDraft(null)
      dirtyRef.current = true
    }
  }

  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) return
    if (tool === "lupa" && lensRef.current) lensRef.current.style.opacity = "0"
  }

  const captureRegion = async (clientX: number, clientY: number) => {
    const img = imgRef.current
    if (!img || capturePendingRef.current) return
    if (!(img.complete && img.naturalWidth > 0)) {
      capturePendingRef.current = true
      const ready = await new Promise<boolean>((resolve) => {
        if (img.complete) return resolve(img.naturalWidth > 0)
        let settled = false
        const done = (ok: boolean) => {
          if (settled) return
          settled = true
          img.removeEventListener("load", onLoad)
          img.removeEventListener("error", onError)
          resolve(ok)
        }
        const onLoad = () => done(img.naturalWidth > 0)
        const onError = () => done(false)
        img.addEventListener("load", onLoad)
        img.addEventListener("error", onError)
        setTimeout(() => done(img.complete && img.naturalWidth > 0), 45000)
      })
      capturePendingRef.current = false
      if (!ready) {
        toast("A imagem não pôde ser carregada para captura. Verifique o arquivo da radiografia.", "error")
        return
      }
    }
    const c = toImageCoords(clientX, clientY)
    if (!c) return
    const region = Math.min((MAG / ZOOM) * c.scale, img.naturalWidth, img.naturalHeight)
    const x = Math.max(0, Math.min(c.x - region / 2, img.naturalWidth - region))
    const y = Math.max(0, Math.min(c.y - region / 2, img.naturalHeight - region))
    const OUT = 512
    const canvas = document.createElement("canvas")
    canvas.width = OUT
    canvas.height = OUT
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    try {
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(img, x, y, region, region, 0, 0, OUT, OUT)
      const url = canvas.toDataURL("image/png")
      setSnapshots((s) => [...s, url])
      toast("Região ampliada adicionada ao lado direito.", "success")
    } catch (e) {
      console.error("Falha ao capturar região ampliada:", e)
      toast("Não foi possível capturar a região ampliada.", "error")
    }
  }

  const undo = () => {
    setShapes((s) => s.slice(0, -1))
    dirtyRef.current = true
  }
  const clear = () => {
    setShapes([])
    setDraft(null)
    dirtyRef.current = true
  }

  const save = useCallback(async (): Promise<boolean> => {
    const current = shapesRef.current
    if (savingRef.current) return true
    savingRef.current = true
    setSaving(true)
    try {
      const res = await fetch(`/api/app/radiographs/${radiograph.id}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layerJson: current }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar anotações.")
      dirtyRef.current = false
      toast("Anotações salvas com segurança.", "success")
      return true
    } catch (e) {
      toast((e as Error).message, "error")
      return false
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }, [radiograph.id, toast])

  const closeWithSave = useCallback(async () => {
    if (closingRef.current) return
    closingRef.current = true
    try {
      if (dirtyRef.current && shapesRef.current.length > 0) {
        const ok = await save()
        if (!ok) {
          toast("Não foi possível salvar. Feche novamente para tentar.", "error")
          return
        }
      }
      onClose()
    } finally {
      closingRef.current = false
    }
  }, [save, onClose, toast])

  useEffect(() => {
    if (!open) return
    setShapes([])
    setDraft(null)
    setImgLoaded(false)
    setLoaded(false)
    setSnapshots([])
    dirtyRef.current = false
    closingRef.current = false
    shapesRef.current = []
    let cancelled = false
    if (lensRef.current) lensRef.current.style.opacity = "0"
    ;(async () => {
      try {
        const res = await fetch(`/api/app/radiographs/${radiograph.id}/annotations`)
        const data = await res.json()
        if (res.ok && data.annotation && !cancelled) {
          const layer = Array.isArray(data.annotation.layerJson) ? (data.annotation.layerJson as unknown[]) : []
          setShapes(layer.map(normalizeLoaded).filter((s): s is ViewerShape => s !== null))
        }
      } catch {
        // sem camada salva
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, radiograph?.id])

  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeWithSave()
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setShapes((s) => s.slice(0, -1))
        dirtyRef.current = true
      }
    }
    document.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [open, onClose, closeWithSave])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#05070d]">
      <div className="flex items-center justify-between gap-3 border-b border-[#13203e] bg-[#0a1120] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-100">{title || radiograph.label || "Radiografia"}</span>
          {renderable && (
            <span className="hidden text-xs text-slate-500 md:inline">Clique e arraste sobre a imagem para anotar</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {renderable && (
            <>
              <ToolButton icon={Undo2} label="Desfazer (Ctrl+Z)" onClick={undo} disabled={shapes.length === 0} />
              <ToolButton icon={Trash2} label="Limpar tudo" onClick={clear} disabled={shapes.length === 0} danger />
              <Button className="ml-1 h-8 gap-1.5 px-3 text-xs" onClick={save} loading={saving}>
                <Save className="h-3.5 w-3.5" /> Salvar
              </Button>
            </>
          )}
          <button
            onClick={closeWithSave}
            className="ml-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {renderable && (
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#13203e] bg-[#0a1120] px-4 py-2">
        {TOOLS.map((t) => {
          const Icon = TOOL_ICONS[t.id]
          return (
            <button
              key={t.id}
              onClick={() => {
                if (lensRef.current) lensRef.current.style.opacity = "0"
                setTool(t.id)
              }}
              title={t.label}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition",
                tool === t.id
                  ? "border-sky-500/50 bg-sky-500/10 text-sky-300"
                  : "border-[#1c2942] bg-[#0c1322] text-slate-400 hover:text-slate-200",
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          )
        })}
      </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {renderable ? (
          <>
        <div className={cn("absolute inset-0 flex items-center justify-center transition-opacity duration-200", imgLoaded ? "opacity-100" : "opacity-0")}>
          <img
            ref={imgRef}
            src={radiograph.fileUrl}
            alt={radiograph.label || "Radiografia"}
            className="max-h-full max-w-full select-none"
            draggable={false}
            onLoad={() => setImgLoaded(true)}
          />
        </div>

        {imgLoaded && (
          <svg
            className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
          >
            {shapes.map((s, i) => (
              <ShapeSvg key={i} shape={s} />
            ))}
            {draft && <ShapeSvg shape={draft} />}
          </svg>
        )}

        {tool === "lupa" && (
          <div
            ref={lensRef}
            className="pointer-events-none absolute z-10 h-[220px] w-[220px] rounded-full border-[3px] border-sky-400/80 opacity-0 shadow-[0_0_40px_rgba(0,0,0,0.9)]"
            style={{ backgroundRepeat: "no-repeat", backgroundPosition: "0px 0px" }}
          />
        )}

        {loaded && !imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Carregando imagem...</div>
        )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <FileText className="h-14 w-14 text-slate-600" />
            <div>
              <p className="text-base font-semibold text-slate-200">
                {radiograph.mimeType === "application/pdf" ? "Documento PDF" : radiograph.mimeType === "image/dicom" ? "Imagem DICOM" : "Arquivo"}
              </p>
              <p className="mt-1 text-sm text-slate-500">Este formato não pode ser anotado. Baixe o arquivo original abaixo.</p>
            </div>
            <a
              href={`${radiograph.fileUrl}?download=1`}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_20px_-4px_rgba(14,165,233,0.5)] transition hover:bg-sky-400"
            >
              <Download className="h-4 w-4" /> Baixar arquivo
            </a>
          </div>
        )}
      </div>

      {renderable && (
        <aside className="flex max-h-[45vh] w-full shrink-0 flex-col border-t border-[#13203e] bg-[#0a1120] md:max-h-none md:w-[300px] md:border-l md:border-t-0">
          <div className="border-b border-[#13203e] px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-100">Regiões ampliadas</h3>
              {snapshots.length > 0 && (
                <button onClick={() => setSnapshots([])} className="text-[11px] text-rose-300 transition hover:text-rose-200">
                  Limpar tudo
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Com a ferramenta Lupa ativa, clique sobre a radiografia para capturar a região ampliada.
            </p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {snapshots.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#1c2942] py-8 text-center">
                <ZoomIn className="h-6 w-6 text-slate-600" />
                <p className="text-xs text-slate-500">Nenhuma região capturada ainda.</p>
              </div>
            ) : (
              snapshots.map((url, i) => (
                <div key={`${url.slice(-24)}-${i}`} className="group relative overflow-hidden rounded-xl border border-[#16213a] bg-[#0a1120]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Região ${i + 1}`} className="w-full object-contain" />
                  <div className="flex items-center justify-between gap-2 border-t border-[#16213a] px-3 py-1.5">
                    <span className="text-[11px] font-medium text-slate-400">Região {i + 1}</span>
                    <button
                      onClick={() => setSnapshots((s) => s.filter((_, j) => j !== i))}
                      className="rounded-md p-1 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label={`Remover região ${i + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}
      </div>
    </div>
  )
}

function ToolButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof Undo2
  label: string
  onClick: () => void
  disabled: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "rounded-lg p-1.5 transition disabled:opacity-30",
        danger ? "text-rose-400 hover:bg-rose-500/10" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}