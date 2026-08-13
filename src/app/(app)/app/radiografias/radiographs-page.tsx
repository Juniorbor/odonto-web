"use client"

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowUpRight, Camera, CalendarDays, Check, Circle, Download, FileText, FileUp, Minus, MousePointer2, Pencil, Save, Spline, Square, Trash2, Stethoscope, Undo2, ZoomIn } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/feedback"
import { Button } from "@/components/ui/button"
import { Input, Textarea, Select, Field } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { cn, formatDate, isImageRenderable } from "@/lib/utils"
import { uploadWithChunks, formatBytes, CLIENT_MAX_UPLOAD } from "@/lib/client-upload"

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

type Tool = "select" | "zoom" | "line" | "arrow" | "rect" | "ellipse" | "dash" | "region" | "pencil" | "text"
type Pt = { x: number; y: number }
type Shape = { type: Tool; points: Pt[]; color: string; width: number; text?: string }

const COLORS = ["#38bdf8", "#f472b6", "#fbbf24", "#34d399", "#fb7185", "#ffffff"]

const TOOLS: { id: Tool; label: string; icon: ReactNode }[] = [
  { id: "line", label: "Linha", icon: <Minus className="h-4 w-4" /> },
  { id: "arrow", label: "Seta", icon: <ArrowUpRight className="h-4 w-4" /> },
  { id: "ellipse", label: "Círculo", icon: <Circle className="h-4 w-4" /> },
  { id: "rect", label: "Retângulo", icon: <Square className="h-4 w-4" /> },
  { id: "dash", label: "Linha pontilhada", icon: <Minus className="h-4 w-4" /> },
  { id: "region", label: "Região por pontos (2 cliques finaliza)", icon: <Spline className="h-4 w-4" /> },
  { id: "pencil", label: "Desenho livre", icon: <Pencil className="h-4 w-4" /> },
  { id: "text", label: "Texto", icon: <span className="text-xs font-bold">T</span> },
  { id: "select", label: "Selecionar / mover / excluir", icon: <MousePointer2 className="h-4 w-4" /> },
  { id: "zoom", label: "Lupa", icon: <ZoomIn className="h-4 w-4" /> },
]

const MAG = 180
const ZOOM = 2.5

function normalizeLayer(raw: unknown): Shape | null {
  const r = (raw ?? {}) as Record<string, unknown>
  const asArr = (v: unknown): Pt[] => (Array.isArray(v) ? (v as Pt[]) : [])
  const color = typeof r.color === "string" ? r.color : COLORS[0]
  const width = typeof r.width === "number" ? r.width : 3
  switch (r.type) {
    case "line":
    case "dash": {
      const a = asArr(r.points)[0]
      const b = asArr(r.points)[1]
      if (!a || !b) return null
      return { type: r.type as "line" | "dash", points: [a, b], color, width }
    }
    case "arrow": {
      const pts = asArr(r.points)
      const a = pts[0]
      const b = pts[1]
      if (a && b) return { type: "arrow", points: [a, b], color, width }
      const x1 = typeof r.x1 === "number" ? r.x1 : 0
      const y1 = typeof r.y1 === "number" ? r.y1 : 0
      const x2 = typeof r.x2 === "number" ? r.x2 : 0
      const y2 = typeof r.y2 === "number" ? r.y2 : 0
      return { type: "arrow", points: [{ x: x1, y: y1 }, { x: x2, y: y2 }], color, width }
    }
    case "ellipse":
    case "circle": {
      const pts = asArr(r.points)
      if (pts.length >= 2) {
        return { type: "ellipse", points: [pts[0], pts[pts.length - 1]], color, width }
      }
      const cx = typeof r.cx === "number" ? r.cx : 0
      const cy = typeof r.cy === "number" ? r.cy : 0
      const rx = typeof r.rx === "number" ? r.rx : 1
      const ry = typeof r.ry === "number" ? r.ry : 1
      return { type: "ellipse", points: [{ x: cx - rx, y: cy - ry }, { x: cx + rx, y: cy + ry }], color, width }
    }
    case "rect": {
      const pts = asArr(r.points)
      if (pts.length >= 2) {
        return { type: "rect", points: [pts[0], pts[pts.length - 1]], color, width }
      }
      const x = typeof r.x === "number" ? r.x : 0
      const y = typeof r.y === "number" ? r.y : 0
      const w = typeof r.w === "number" ? r.w : 0
      const h = typeof r.h === "number" ? r.h : 0
      return { type: "rect", points: [{ x, y }, { x: x + w, y: y + h }], color, width }
    }
    case "path": {
      const rawPts = r.points as unknown[]
      if (!Array.isArray(rawPts)) return null
      const pts: Pt[] = rawPts.map((p) => {
        if (Array.isArray(p) && p.length >= 2) return { x: Number(p[0]), y: Number(p[1]) }
        return p as Pt
      })
      if (pts.length < 2) return null
      return { type: "pencil", points: pts, color, width }
    }
    case "pencil":
    case "region": {
      const pts = asArr(r.points)
      if (pts.length < 2) return null
      return { type: r.type as "pencil" | "region", points: pts, color, width }
    }
    case "text": {
      const a = asArr(r.points)[0]
      if (!a) return null
      return {
        type: "text",
        points: [a],
        color,
        width: typeof r.width === "number" ? r.width : 20,
        text: typeof r.text === "string" ? r.text : "",
      }
    }
    default:
      return null
  }
}

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
  const [formPatient, setFormPatient] = useState("")
  const [formExam, setFormExam] = useState("PANORAMICA")
  const [formLabel, setFormLabel] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formTakenAt, setFormTakenAt] = useState(new Date().toISOString().slice(0, 10))

  const openUpload = () => {
    setUploadOpen(true)
    setFile(null)
    setFormPatient(patientFilter !== "all" ? patientFilter : searchParams.get("patientId") || "")
    setFormExam("PANORAMICA")
    setFormLabel("")
    setFormNotes("")
    setFormTakenAt(new Date().toISOString().slice(0, 10))
  }

  const [tool, setTool] = useState<Tool>("line")
  const [color, setColor] = useState(COLORS[0])
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [shapes, setShapes] = useState<Shape[]>([])
  const [draft, setDraft] = useState<Shape | null>(null)
  const [view, setView] = useState<{ w: number; h: number } | null>(null)
  const [imgError, setImgError] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [hover, setHover] = useState<Pt | null>(null)
  const [drag, setDrag] = useState<{ si: number; pi?: number; start?: Pt } | null>(null)
  const [editing, setEditing] = useState<{ si: number } | null>(null)
  const [textValue, setTextValue] = useState("")
  const [fontSize, setFontSize] = useState(20)
  const [exporting, setExporting] = useState(false)
  const [savingAnn, setSavingAnn] = useState(false)
  const [snapshots, setSnapshots] = useState<string[]>([])
  const drawingRef = useRef(false)
  const lastClickRef = useRef<{ t: number; p: Pt } | null>(null)
  const zoomGuardRef = useRef(0)
  const capturingRef = useRef(false)
  const shapesRef = useRef<Shape[]>([])
  const dirtyRef = useRef(false)
  const savingAnnRef = useRef(false)
  const closingRef = useRef(false)
  const lastSavedRef = useRef("[]")
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    shapesRef.current = shapes
    if (JSON.stringify(shapes) !== lastSavedRef.current) dirtyRef.current = true
    else dirtyRef.current = false
  }, [shapes])

  useEffect(() => {
    setShapes([])
    setDraft(null)
    setView(null)
    setImgError(false)
    setSelected(null)
    setHover(null)
    setDrag(null)
    setEditing(null)
    setSnapshots([])
    drawingRef.current = false
    lastClickRef.current = null
    zoomGuardRef.current = 0
    dirtyRef.current = false
    closingRef.current = false
    shapesRef.current = []
    lastSavedRef.current = "[]"
    imgRef.current = null
    if (viewing) {
      ;(async () => {
        try {
          const res = await fetch(`/api/app/radiographs/${viewing.id}/annotations`)
          const data = await res.json()
          if (res.ok && data.annotation && Array.isArray(data.annotation.layerJson)) {
            const layer = (data.annotation.layerJson as unknown[])
              .map(normalizeLayer)
              .filter((s): s is Shape => s !== null)
            setShapes(layer)
            shapesRef.current = layer
            lastSavedRef.current = JSON.stringify(layer)
            dirtyRef.current = false
          }
        } catch {
          // sem camada salva
        }
      })()
    }
  }, [viewing])

  const pos = (e: ReactPointerEvent<SVGSVGElement>): Pt => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const distToSeg = (p: Pt, a: Pt, b: Pt) => {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const l2 = dx * dx + dy * dy
    let t = l2 === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
  }

  const hitShape = (p: Pt, s: Shape): boolean => {
    const pad = Math.max(s.width, 6) + 6
    if (s.type === "pencil" || s.type === "region") {
      for (let i = 1; i < s.points.length; i++) {
        if (distToSeg(p, s.points[i - 1], s.points[i]) <= pad) return true
      }
      return false
    }
    if (s.type === "text") {
      return Math.hypot(p.x - s.points[0].x, p.y - s.points[0].y) <= Math.max(24, s.width + 10)
    }
    const a = s.points[0]
    const b = s.points[s.points.length - 1]
    if (!b) return false
    if (s.type === "line" || s.type === "arrow" || s.type === "dash") return distToSeg(p, a, b) <= pad
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const w = Math.abs(b.x - a.x)
    const h = Math.abs(b.y - a.y)
    if (s.type === "rect") {
      return p.x >= x - pad && p.x <= x + w + pad && p.y >= y - pad && p.y <= y + h + pad
    }
    if (s.type === "ellipse") {
      const cx = (a.x + b.x) / 2
      const cy = (a.y + b.y) / 2
      const rx = Math.max(w / 2, 1)
      const ry = Math.max(h / 2, 1)
      return Math.abs(Math.hypot((p.x - cx) / rx, (p.y - cy) / ry) - 1) <= pad / Math.max(rx, ry)
    }
    return false
  }

  const selectAt = (p: Pt): number | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitShape(p, shapes[i])) return i
    }
    return null
  }

  const vertexAt = (p: Pt, list: Shape[]): { si: number; pi: number } | null => {
    for (let i = list.length - 1; i >= 0; i--) {
      const s = list[i]
      if (s.type !== "region" && s.type !== "pencil") continue
      for (let pi = 0; pi < s.points.length; pi++) {
        if (Math.hypot(p.x - s.points[pi].x, p.y - s.points[pi].y) <= 8) return { si: i, pi }
      }
    }
    return null
  }

  const commitDraft = () => {
    if (!draft) return
    if (draft.points.length >= 2) setShapes((s) => [...s, draft])
    setDraft(null)
    setSelected(null)
  }

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const p = pos(e)
    if (tool === "zoom") {
      if (!viewing) return
      const now = Date.now()
      if (now - zoomGuardRef.current < 350) {
        zoomGuardRef.current = now
        return
      }
      zoomGuardRef.current = now
      captureRegion(p)
      return
    }
    if (!view) return
    e.preventDefault()
    if (tool === "select") {
      const v = vertexAt(p, shapes)
      if (v) {
        setSelected(v.si)
        setDrag(v)
        e.currentTarget.setPointerCapture(e.pointerId)
        return
      }
      const hit = selectAt(p)
      if (hit != null) {
        setSelected(hit)
        setDrag({ si: hit, start: p })
        e.currentTarget.setPointerCapture(e.pointerId)
      } else {
        setSelected(null)
      }
      return
    }
    if (tool === "text") {
      const pre = textValue.trim()
      const idx = shapes.length
      setShapes((s) => [...s, { type: "text", points: [p], color, width: fontSize, text: pre }])
      setSelected(idx)
      if (!pre) setEditing({ si: idx })
      return
    }
    if (tool === "region") {
      const now = Date.now()
      if (lastClickRef.current && now - lastClickRef.current.t < 350 && Math.hypot(p.x - lastClickRef.current.p.x, p.y - lastClickRef.current.p.y) < 8) {
        lastClickRef.current = null
        commitDraft()
        return
      }
      lastClickRef.current = { t: now, p }
      setDraft((d) => (d && d.type === "region" ? { ...d, points: [...d.points, p] } : { type: "region", points: [p], color, width: strokeWidth }))
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    setDraft({ type: tool, points: [p], color, width: strokeWidth })
  }

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const p = pos(e)
    setHover(p)
    if (drag) {
      const { si } = drag
      if (drag.pi !== undefined) {
        setShapes((s) => s.map((sh, i) => (i === si ? { ...sh, points: sh.points.map((pt, j) => (j === drag.pi ? p : pt)) } : sh)))
      } else if (drag.start) {
        const dx = p.x - drag.start.x
        const dy = p.y - drag.start.y
        setShapes((s) => s.map((sh, i) => (i === si ? { ...sh, points: sh.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) } : sh)))
      }
      return
    }
    if (!draft || !drawingRef.current) return
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        points: prev.type === "pencil" ? [...prev.points, p] : [prev.points[0], p],
      }
    })
  }

  const onPointerUp = () => {
    drawingRef.current = false
    setDrag(null)
    if (!draft) return
    if (draft.type === "region") return
    if (draft.points.length >= 2) setShapes((s) => [...s, draft])
    setDraft(null)
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (!img.naturalWidth) return
    setImgError(false)
    const MAX_W = 1200
    const MAX_H = 720
    const scale = Math.min(MAX_W / img.naturalWidth, MAX_H / img.naturalHeight, 1)
    setView({ w: Math.round(img.naturalWidth * scale), h: Math.round(img.naturalHeight * scale) })
  }

  const waitForImage = (img: HTMLImageElement, timeoutMs = 45000): Promise<boolean> =>
    new Promise((resolve) => {
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
      setTimeout(() => done(img.complete && img.naturalWidth > 0), timeoutMs)
    })

  const captureRegion = async (p: Pt) => {
    if (!viewing || capturingRef.current) return
    const img = imgRef.current
    if (!img) return
    if (!(img.complete && img.naturalWidth > 0)) {
      capturingRef.current = true
      toast("A imagem ainda está carregando. A região será capturada automaticamente quando terminar.", "info")
      const ready = await waitForImage(img)
      capturingRef.current = false
      if (!ready) {
        toast("A imagem não pôde ser carregada para captura. Verifique o arquivo da radiografia.", "error")
        return
      }
    }
    const rect = img.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const region = MAG / ZOOM
    const x = Math.max(0, Math.min(p.x - region / 2, rect.width - region))
    const y = Math.max(0, Math.min(p.y - region / 2, rect.height - region))
    const scale = img.naturalWidth / rect.width
    const OUT = 512
    const canvas = document.createElement("canvas")
    canvas.width = OUT
    canvas.height = OUT
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    try {
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(img, x * scale, y * scale, region * scale, region * scale, 0, 0, OUT, OUT)
      const url = canvas.toDataURL("image/png")
      setSnapshots((s) => [...s, url])
      toast("Região ampliada adicionada ao lado direito.", "success")
    } catch (e) {
      console.error("Falha ao capturar região ampliada:", e)
      toast("Não foi possível capturar a região ampliada.", "error")
    }
  }

  const shapeToSvg = (s: Shape): string => {
    const esc = (v: string) =>
      v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    const stroke = `stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" fill="none"`
    const dash = s.type === "dash" ? ` stroke-dasharray="${s.width * 5} ${s.width * 4}"` : ""
    const a = s.points[0]
    if (s.type === "text") {
      return `<text x="${a.x}" y="${a.y}" fill="${s.color}" font-size="${s.width}" font-weight="600">${esc(s.text ?? "")}</text>`
    }
    if (s.type === "region") {
      return `<polyline ${stroke}${dash} stroke-linejoin="round" points="${s.points.map((p) => `${p.x},${p.y}`).join(" ")}" />`
    }
    if (s.type === "pencil") {
      return `<polyline ${stroke} stroke-linejoin="round" points="${s.points.map((p) => `${p.x},${p.y}`).join(" ")}" />`
    }
    const b = s.points[s.points.length - 1]
    if (!b) return ""
    if (s.type === "line" || s.type === "dash") {
      return `<line ${stroke}${dash} x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />`
    }
    if (s.type === "arrow") {
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const len = 14 + s.width * 2
      const spread = 0.35
      const p1 = { x: b.x - len * Math.cos(angle) + len * spread * Math.sin(angle), y: b.y - len * Math.sin(angle) - len * spread * Math.cos(angle) }
      const p2 = { x: b.x - len * Math.cos(angle) - len * spread * Math.sin(angle), y: b.y - len * Math.sin(angle) + len * spread * Math.cos(angle) }
      return `<line ${stroke} x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" /><polygon points="${b.x},${b.y} ${p1.x},${p1.y} ${p2.x},${p2.y}" fill="${s.color}" />`
    }
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const w = Math.abs(b.x - a.x)
    const h = Math.abs(b.y - a.y)
    if (s.type === "rect") return `<rect ${stroke} x="${x}" y="${y}" width="${w}" height="${h}" rx="3" />`
    if (s.type === "ellipse") {
      return `<ellipse ${stroke} cx="${(a.x + b.x) / 2}" cy="${(a.y + b.y) / 2}" rx="${w / 2}" ry="${h / 2}" />`
    }
    return ""
  }

  const persistAnnotations = useCallback(async (): Promise<boolean> => {
    if (!viewing) return false
    const current = shapesRef.current
    if (savingAnnRef.current) return true
    savingAnnRef.current = true
    setSavingAnn(true)
    try {
      const res = await fetch(`/api/app/radiographs/${viewing.id}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layerJson: current }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar anotações.")
      lastSavedRef.current = JSON.stringify(current)
      dirtyRef.current = false
      toast("Anotações salvas com segurança.", "success")
      return true
    } catch (e) {
      toast((e as Error).message, "error")
      return false
    } finally {
      savingAnnRef.current = false
      setSavingAnn(false)
    }
  }, [viewing, toast])

  const closeViewer = useCallback(async () => {
    if (!viewing || closingRef.current) return
    closingRef.current = true
    try {
      if (dirtyRef.current) {
        const ok = await persistAnnotations()
        if (!ok) {
          toast("Não foi possível salvar. Feche novamente para tentar.", "error")
          return
        }
      }
      setViewing(null)
    } finally {
      closingRef.current = false
    }
  }, [viewing, persistAnnotations, toast])

  const saveViewer = useCallback(() => {
    void persistAnnotations()
  }, [persistAnnotations])

  const exportAnnotated = async () => {
    if (!view || !viewing || shapes.length === 0 || exporting) return
    setExporting(true)
    try {
      const SCALE = 2
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${view.w}" height="${view.h}" viewBox="0 0 ${view.w} ${view.h}">${shapes.map(shapeToSvg).join("")}</svg>`
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = reject
          img.src = src
        })
      const photo = await loadImg(viewing.url)
      const ann = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg))
      const canvas = document.createElement("canvas")
      canvas.width = view.w * SCALE
      canvas.height = view.h * SCALE
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(photo, 0, 0, canvas.width, canvas.height)
      ctx.drawImage(ann, 0, 0, canvas.width, canvas.height)
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `${viewing.label || "radiografia"}-anotada.png`
      link.click()
      toast("Trabalho salvo como imagem PNG.", "success")
    } catch {
      toast("Não foi possível salvar.", "error")
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!viewing) return
      if ((e.key === "Delete" || e.key === "Backspace") && selected != null) {
        const target = e.target as HTMLElement | null
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return
        e.preventDefault()
        setShapes((s) => s.filter((_, i) => i !== selected))
        setSelected(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [viewing, selected])

  const shapeEl = (s: Shape, key: number, over: Record<string, string | number> = {}): ReactNode | null => {
    const a = s.points[0]
    if (s.type === "text") {
      return (
        <text
          key={key}
          x={a.x}
          y={a.y}
          fill={(over.fill as string) ?? s.color}
          fontSize={(over.fontSize as number) ?? s.width}
          fontWeight={600}
          style={over.stroke != null ? ({ paintOrder: "stroke", stroke: over.stroke, strokeWidth: (over.strokeWidth as number) ?? 2 } as CSSProperties) : undefined}
        >
          {s.text ?? ""}
        </text>
      )
    }
    const base = {
      stroke: s.color,
      strokeWidth: s.width,
      strokeLinecap: "round" as const,
      fill: "none",
      ...(s.type === "dash" || s.type === "region" ? { strokeDasharray: `${s.width * 5} ${s.width * 4}` } : {}),
      ...over,
    }
    if (s.type === "pencil" || s.type === "region") {
      return (
        <polyline key={key} {...base} points={s.points.map((p) => `${p.x},${p.y}`).join(" ")} strokeLinejoin="round" />
      )
    }
    const b = s.points[s.points.length - 1]
    if (!b || (a.x === b.x && a.y === b.y)) return null
    if (s.type === "line" || s.type === "dash") {
      return <line key={key} {...base} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
    }
    if (s.type === "arrow") {
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const len = 14 + s.width * 2
      const spread = 0.35
      const p1 = {
        x: b.x - len * Math.cos(angle) + len * spread * Math.sin(angle),
        y: b.y - len * Math.sin(angle) - len * spread * Math.cos(angle),
      }
      const p2 = {
        x: b.x - len * Math.cos(angle) - len * spread * Math.sin(angle),
        y: b.y - len * Math.sin(angle) + len * spread * Math.cos(angle),
      }
      return (
        <g key={key}>
          <line {...base} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          <polygon points={`${b.x},${b.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`} fill={s.color} stroke="none" />
        </g>
      )
    }
    const x = Math.min(a.x, b.x)
    const y = Math.min(a.y, b.y)
    const w = Math.abs(b.x - a.x)
    const h = Math.abs(b.y - a.y)
    if (s.type === "rect") return <rect key={key} {...base} x={x} y={y} width={w} height={h} rx={3} />
    if (s.type === "ellipse") {
      return <ellipse key={key} {...base} cx={(a.x + b.x) / 2} cy={(a.y + b.y) / 2} rx={w / 2} ry={h / 2} />
    }
    return null
  }

  const renderShape = (s: Shape, key: number): ReactNode | null => {
    const el = shapeEl(s, key)
    if (!el || selected !== key) return el
    return (
      <Fragment key={key}>
        {shapeEl(s, key + 1000, { stroke: "#ffffff", strokeOpacity: 0.75, strokeWidth: s.width + 5, strokeDasharray: "5 5" })}
        {el}
      </Fragment>
    )
  }

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
    if (file.size > CLIENT_MAX_UPLOAD) {
      toast("Arquivo excede o limite de 25MB.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await uploadWithChunks("/api/app/radiographs", file, () => ({
        patientId: formPatient,
        examType: formExam,
        label: formLabel.trim(),
        notes: formNotes.trim(),
        takenAt: formTakenAt,
      }))
      if (!res.ok) {
        toast(res.error ?? "Erro ao enviar arquivo.", "error")
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

  const selectedShape = selected != null ? (shapes[selected] ?? null) : null

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Radiografias <span className="text-gradient">({items.length})</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Exames e imagens dos pacientes da clínica.</p>
        </div>
        <Button onClick={openUpload} className="gap-1.5">
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
                {isImageRenderable(r.mimeType) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={r.url}
                    alt={r.label || r.patient.fullName}
                    className="h-full w-full object-contain transition group-hover:opacity-90"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-600">
                    <FileText className="h-10 w-10" />
                    <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {r.mimeType === "application/pdf" ? "PDF" : r.mimeType === "image/dicom" ? "DICOM" : "Arquivo"}
                    </span>
                  </div>
                )}
              </button>
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {r.label || EXAM_TYPES.find((t) => t.value === r.examType)?.label || r.examType}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{r.patient.fullName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`${r.url}?download=1`}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg p-1.5 text-slate-600 transition hover:bg-sky-500/10 hover:text-sky-300"
                      title="Baixar arquivo original"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => setDeleting(r)}
                      className="rounded-lg p-1.5 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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
            <Button
              onClick={onUpload}
              loading={saving}
              disabled={!file || !formPatient}
              title={formPatient ? "Enviar para o paciente selecionado" : "Selecione o paciente antes de enviar"}
            >
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
                <span className="flex max-w-full flex-col items-center gap-0.5 text-center">
                  <span className="max-w-full truncate text-sky-300">{file.name}</span>
                  <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                </span>
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

          {formPatient && (
            <div className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-sm text-sky-200">
              <Stethoscope className="h-4 w-4 shrink-0 text-sky-400" />
              <span>
                Enviando para: <strong>{patients.find((p) => p.id === formPatient)?.fullName}</strong>
              </span>
            </div>
          )}

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
        onClose={closeViewer}
        title={viewing?.label || "Radiografia"}
        subtitle={viewing ? `${viewing.patient.fullName} • ${formatDate(viewing.takenAt)}` : undefined}
        size="full"
        footer={
          <div className="flex items-center gap-2">
            {viewing && isImageRenderable(viewing.mimeType) && (
              <>
                <Button onClick={saveViewer} loading={savingAnn} className="gap-1.5">
                  <Save className="h-4 w-4" /> Salvar trabalho
                </Button>
                <Button variant="ghost" onClick={exportAnnotated} loading={exporting} disabled={shapes.length === 0} className="gap-1.5">
                  <FileUp className="h-4 w-4" /> Exportar PNG
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={closeViewer}>
              Fechar
            </Button>
          </div>
        }
      >
        {viewing && (
          <div className="space-y-4">
            {!isImageRenderable(viewing.mimeType) ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[#16213a] bg-[#0a1120] px-6 py-16 text-center">
                <FileText className="h-12 w-12 text-slate-600" />
                <div>
                  <p className="text-base font-semibold text-slate-200">
                    {viewing.mimeType === "application/pdf" ? "Documento PDF" : viewing.mimeType === "image/dicom" ? "Imagem DICOM" : "Arquivo"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Este formato não pode ser anotado nesta tela. Baixe o arquivo original abaixo.
                  </p>
                </div>
                <a
                  href={`${viewing.url}?download=1`}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-medium text-white shadow-[0_4px_20px_-4px_rgba(14,165,233,0.5)] transition hover:bg-sky-400"
                >
                  <Download className="h-4 w-4" /> Baixar arquivo
                </a>
              </div>
            ) : (
            <div className="flex flex-col gap-4 xl:flex-row">
              <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-[#16213a] bg-[#0a1120] p-2">
              <span className="mr-1 select-none text-[10px] font-semibold uppercase tracking-widest text-sky-400/60" title="Versão do visualizador (v3 = captura automática ativa)">
                v3
              </span>
              {TOOLS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTool(t.id)
                    setSelected(null)
                    setDraft(null)
                    setEditing(null)
                  }}
                  title={t.label}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-xl transition",
                    tool === t.id
                      ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                  )}
                >
                  {t.icon}
                </button>
              ))}
              <div className="mx-1 h-6 w-px bg-[#1c2942]" />
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  title={c}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition",
                    color === c ? "ring-2 ring-white/40" : "",
                    c === "#ffffff" ? "border-slate-500" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <div className="mx-1 h-6 w-px bg-[#1c2942]" />
              {tool !== "text" &&
                [2, 4, 6].map((w) => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    title={`Espessura ${w}`}
                    className={cn(
                      "inline-flex h-9 items-center justify-center rounded-xl px-2.5 transition",
                      strokeWidth === w ? "bg-sky-500/15 text-sky-300" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                    )}
                  >
                    <span className="rounded-full bg-current" style={{ width: w + 10, height: w }} />
                  </button>
                ))}
              {(tool === "text" || selectedShape?.type === "text") && (
                <>
                  <input
                    value={selectedShape?.type === "text" ? (selectedShape.text ?? "") : textValue}
                    onChange={(e) => {
                      const v = e.target.value
                      setTextValue(v)
                      if (selected != null && shapes[selected]?.type === "text") {
                        setShapes((curr) => curr.map((sh, i) => (i === selected ? { ...sh, text: v } : sh)))
                      }
                    }}
                    placeholder="Digite o texto..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && selectedShape?.type === "text" && tool !== "text") setTool("select")
                    }}
                    className="h-9 w-40 rounded-xl border border-[#1c2942] bg-[#0a1120] px-3 text-xs text-slate-200 outline-none focus:border-sky-600/50"
                  />
                  <div className="mx-1 h-6 w-px bg-[#1c2942]" />
                  {[14, 18, 24, 32].map((s) => (
                    <button
                      key={`fs${s}`}
                      onClick={() => {
                        setFontSize(s)
                        if (selected != null && shapes[selected]?.type === "text") {
                          setShapes((curr) => curr.map((sh, i) => (i === selected ? { ...sh, width: s } : sh)))
                        }
                      }}
                      title={`Fonte ${s}px`}
                      className={cn(
                        "inline-flex h-9 items-center justify-center rounded-xl px-2 text-xs font-semibold transition",
                        (selectedShape?.type === "text" ? (selectedShape.width as number) : fontSize) === s
                          ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/40"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </>
              )}
              <div className="mx-1 h-6 w-px bg-[#1c2942]" />
              {draft?.type === "region" && (
                <button
                  onClick={commitDraft}
                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-emerald-500/15 px-2.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/40 transition hover:bg-emerald-500/25"
                >
                  <Check className="h-3.5 w-3.5" /> Concluir
                </button>
              )}
              {selected != null && (
                <button
                  onClick={() => {
                    setShapes((s) => s.filter((_, i) => i !== selected))
                    setSelected(null)
                  }}
                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-rose-500/15 px-2.5 text-xs font-medium text-rose-300 ring-1 ring-rose-500/40 transition hover:bg-rose-500/25"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              )}
              <button
                onClick={() => {
                  setDraft(null)
                  setShapes((s) => s.slice(0, -1))
                  setSelected(null)
                }}
                title="Desfazer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setDraft(null)
                  setShapes([])
                  setSelected(null)
                }}
                title="Limpar tudo"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#16213a] bg-[#0a1120] p-1">
              <div className="relative mx-auto" style={{ width: view?.w ?? "100%", height: view?.h ?? 360 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewing.url}
                  alt={viewing.label || "Radiografia"}
                  onLoad={onImageLoad}
                  onError={() => setImgError(true)}
                  ref={imgRef}
                  className="block h-auto w-full object-contain"
                  draggable={false}
                />
                {!view && !imgError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
                      Carregando imagem...
                    </span>
                  </div>
                )}
                {!view && imgError && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-rose-300">
                    Não foi possível carregar a imagem da radiografia. Tente baixar o arquivo original.
                  </div>
                )}
                {view && (
                  <svg
                    width={view.w}
                    height={view.h}
                    viewBox={`0 0 ${view.w} ${view.h}`}
                    className={cn(
                      "absolute left-0 top-0 touch-none",
                      tool === "select" ? "cursor-pointer" : tool === "zoom" ? "cursor-zoom-in" : "cursor-crosshair",
                    )}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={() => setHover(null)}
                    onDoubleClick={commitDraft}
                  >
                    {shapes.map((s, i) => renderShape(s, i))}
                    {draft && renderShape(draft, -1)}
                    {draft?.type === "region" && draft.points.length > 0 && (
                      <g>
                        {draft.points.map((pt, i) => (
                          <circle key={i} cx={pt.x} cy={pt.y} r={4} fill={draft.color} stroke="#000" strokeOpacity={0.5} strokeWidth={1} />
                        ))}
                        {hover && (
                          <line
                            stroke={draft.color}
                            strokeWidth={draft.width}
                            strokeDasharray={`${draft.width * 5} ${draft.width * 4}`}
                            strokeLinecap="round"
                            x1={draft.points[draft.points.length - 1].x}
                            y1={draft.points[draft.points.length - 1].y}
                            x2={hover.x}
                            y2={hover.y}
                          />
                        )}
                      </g>
                    )}
                    {selected != null && shapes[selected] && (shapes[selected].type === "region" || shapes[selected].type === "pencil") && (
                      <g>
                        {shapes[selected].points.map((pt, pi) => (
                          <g key={`h${pi}`}>
                            <circle cx={pt.x} cy={pt.y} r={7} fill="rgba(56,189,248,0.2)" stroke="#38bdf8" strokeWidth={1.5} />
                            <circle cx={pt.x} cy={pt.y} r={2.5} fill="#38bdf8" />
                          </g>
                        ))}
                      </g>
                    )}
                  </svg>
                )}
                {tool === "zoom" && !view && (
                  <svg
                    className="absolute left-0 top-0 h-full w-full cursor-zoom-in touch-none"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={() => setHover(null)}
                  />
                )}
                {tool === "text" && editing != null && shapes[editing.si]?.type === "text" && view && (
                  <input
                    autoFocus
                    value={shapes[editing.si].text ?? ""}
                    onChange={(e) =>
                      setShapes((curr) => curr.map((sh, i) => (i === editing.si ? { ...sh, text: e.target.value } : sh)))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        setEditing(null)
                        setTool("select")
                      }
                      if (e.key === "Escape") {
                        e.preventDefault()
                        setShapes((curr) => curr.filter((_, i) => i !== editing.si))
                        setSelected(null)
                        setEditing(null)
                      }
                    }}
                    onBlur={() => {
                      const si = editing.si
                      setShapes((curr) =>
                        !(curr[si]?.text ?? "").trim() ? curr.filter((_, i) => i !== si) : curr,
                      )
                      setSelected(null)
                      setEditing(null)
                    }}
                    placeholder="Digite o texto..."
                    className="absolute z-20 rounded-md border border-sky-500/60 bg-[#0a1120]/60 px-1.5 text-slate-100 caret-sky-300 outline-none placeholder:text-slate-600"
                    style={{
                      left: shapes[editing.si].points[0].x,
                      top: shapes[editing.si].points[0].y - (shapes[editing.si].width ?? 20),
                      fontSize: shapes[editing.si].width ?? 20,
                      color: shapes[editing.si].color,
                      fontWeight: 600,
                      width: Math.max(80, (shapes[editing.si].text ?? "").length * ((shapes[editing.si].width ?? 20) * 0.62) + 24),
                    }}
                  />
                )}
                {tool === "zoom" && view && hover && (
                  <div
                    className="pointer-events-none absolute z-10 overflow-hidden rounded-full border-2 border-sky-400/80 shadow-[0_0_0_3px_rgba(0,0,0,0.35)]"
                    style={{
                      width: MAG,
                      height: MAG,
                      left: Math.max(0, Math.min(hover.x - MAG / 2, view.w - MAG)),
                      top: Math.max(0, Math.min(hover.y - MAG / 2, view.h - MAG)),
                      backgroundImage: `url(${viewing.url})`,
                      backgroundSize: `${view.w * ZOOM}px ${view.h * ZOOM}px`,
                      backgroundPosition: `${MAG / 2 - hover.x * ZOOM}px ${MAG / 2 - hover.y * ZOOM}px`,
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/50" />
                    <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-black/50" />
                    <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/90" />
                  </div>
                )}
                {view && (
                  <p className="pointer-events-none absolute bottom-1 right-2 text-[10px] text-slate-500">
                    {tool === "zoom"
                      ? "Mova o mouse para ampliar; clique para capturar a região ao lado direito"
                      : tool === "region"
                        ? "Clique para marcar os pontos do contorno e dê dois cliques para finalizar"
                        : tool === "text"
                          ? "Clique na imagem e digite o texto (Enter para finalizar)"
                          : tool === "select"
                            ? "Clique para selecionar; arraste o desenho para mover e os pontos para corrigir"
                            : "Escolha uma ferramenta e desenhe sobre a imagem"}
                  </p>
                )}
              </div>
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

              <aside className="w-full shrink-0 xl:w-[320px]">
                <div className="sticky top-4 space-y-4">
                  <div className="rounded-2xl border border-[#16213a] bg-[#0a1120] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-100">Regiões ampliadas</h3>
                      {snapshots.length > 0 && (
                        <button
                          onClick={() => setSnapshots([])}
                          className="text-[11px] text-rose-300 transition hover:text-rose-200"
                        >
                          Limpar tudo
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Com a ferramenta Lupa ativa, clique sobre a panorâmica para capturar a região na imagem ao lado
                      direito.
                    </p>
                    {snapshots.length === 0 ? (
                      <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#1c2942] py-8 text-center">
                        <ZoomIn className="h-6 w-6 text-slate-600" />
                        <p className="text-xs text-slate-500">Nenhuma região capturada ainda.</p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {snapshots.map((url, i) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
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
