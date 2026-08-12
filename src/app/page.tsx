"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Field } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { ToothLogo } from "@/components/ui/tooth-logo"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Erro ao entrar.")
        return
      }
      toast(`Bem-vindo(a), ${data.user.name.split(" ")[0]}!`, "success")
      router.push("/app")
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-glow relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />

      <div className="anim-fade-up relative z-10 grid w-full max-w-[1600px] overflow-hidden rounded-3xl border border-[#1c2942] bg-[#0b1220]/90 shadow-2xl backdrop-blur-xl lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,500px)_minmax(0,1fr)]">
        {/* Coluna esquerda: formulário de login */}
        <div className="flex flex-col justify-center px-7 py-12 sm:px-10 lg:px-12">
          <div className="mb-10 flex items-center gap-3">
            <ToothLogo boxClassName="h-11 w-11 rounded-2xl" />
            <div>
              <p className="text-lg font-bold text-white">
                <span className="text-gradient">Odonto</span>web
              </p>
              <p className="text-[11px] text-slate-500">Plataforma odontológica profissional</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white">Bem-vindo de volta</h1>
          <p className="mt-2 text-sm text-slate-500">Acesse sua conta para continuar.</p>

          <form onSubmit={submit} className="mt-9 space-y-5">
            <Field label="E-mail" required>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="voce@clinica.com.br"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </Field>

            <Field label="Senha" required>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-10 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-sky-300"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[#23345a] bg-[#0b1120] accent-sky-500"
                />
                Lembrar acesso
              </label>
              <Link href="/esqueci-senha" className="text-sm font-medium text-sky-400 transition hover:text-sky-300">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {!loading && <Lock className="h-4 w-4" />}
              Entrar
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-600">
            Não tem conta? <Link href="/contato" className="text-sky-400 hover:text-sky-300">Fale com a nossa equipe comercial</Link>
          </p>
        </div>

        {/* Coluna direita: radiografia panorâmica */}
        <div className="relative hidden overflow-hidden border-l border-[#16213a] bg-gradient-to-br from-[#0a1424] to-[#060b14] lg:block">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
          <PanoramicImage />
        </div>
      </div>
    </div>
  )
}

/* ---------- Radiografia panorâmica com lupa automática de varredura ---------- */

const LUPA_WIDTH_FRAC = 0.20
const LUPA_ZOOM = 2.6

function PanoramicImage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const posRef = useRef({ x: 0, y: 0 })
  const mousePosRef = useRef<{ x: number; y: number } | null>(null)
  const isHoveredRef = useRef(false)
  const rafRef = useRef(0)

  const placeAt = useCallback((x: number, y: number) => {
    const lens = lensRef.current
    const inner = innerRef.current
    const { w, h } = sizeRef.current
    if (!lens || !inner || !w || !h) return

    const lensSize = Math.min(w * LUPA_WIDTH_FRAC, h * 0.38)
    const half = lensSize / 2
    const cx = Math.min(Math.max(x, half), w - half)
    const cy = Math.min(Math.max(y, half), h - half)
    posRef.current = { x: cx, y: cy }

    lens.style.width = `${lensSize}px`
    lens.style.height = `${lensSize}px`
    lens.style.left = `${cx - half}px`
    lens.style.top = `${cy - half}px`
    inner.style.width = `${w * LUPA_ZOOM}px`
    inner.style.height = `${h * LUPA_ZOOM}px`
    inner.style.transform = `translate(${half - cx * LUPA_ZOOM}px, ${half - cy * LUPA_ZOOM}px)`
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const updateSize = () => {
      const rect = stage.getBoundingClientRect()
      if (!rect.width) return
      const changed = sizeRef.current.w !== rect.width || sizeRef.current.h !== rect.height
      sizeRef.current = { w: rect.width, h: rect.height }
      if (posRef.current.x === 0 && posRef.current.y === 0) {
        posRef.current = { x: rect.width * 0.5, y: rect.height * 0.5 }
      } else if (changed) {
        placeAt(posRef.current.x, posRef.current.y)
      }
    }

    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(stage)

    const step = (now: number) => {
      const { w, h } = sizeRef.current
      if (w > 0 && h > 0) {
        let targetX = posRef.current.x
        let targetY = posRef.current.y

        if (isHoveredRef.current && mousePosRef.current) {
          targetX = mousePosRef.current.x
          targetY = mousePosRef.current.y
        } else {
          const lensSize = Math.min(w * LUPA_WIDTH_FRAC, h * 0.38)
          const half = lensSize / 2
          const marginX = half + 20
          const marginY = half + 16

          const minX = marginX
          const maxX = w - marginX
          const minY = marginY
          const maxY = h - marginY

          const centerX = (minX + maxX) / 2
          const centerY = (minY + maxY) / 2
          const ampX = (maxX - minX) / 2
          const ampY = (maxY - minY) / 2.5

          const t = now / 1000
          targetX = centerX + ampX * Math.sin(t * 0.8)
          targetY = centerY + ampY * Math.sin(t * 1.6) * 0.7
        }

        const currentX = posRef.current.x
        const currentY = posRef.current.y
        const lerpFactor = isHoveredRef.current ? 0.2 : 0.08
        const nextX = currentX + (targetX - currentX) * lerpFactor
        const nextY = currentY + (targetY - currentY) * lerpFactor

        placeAt(nextX, nextY)
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [placeAt])

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    isHoveredRef.current = true
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleMouseLeave = () => {
    isHoveredRef.current = false
    mousePosRef.current = null
  }

  return (
    <div className="relative flex h-full min-h-[560px] items-center justify-center px-1 py-2">
      <div
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="group relative w-full overflow-hidden rounded-2xl border border-[#23345a] bg-[#0a101c] shadow-2xl"
        style={{ aspectRatio: "1.894", cursor: "zoom-in" }}
      >
        {/* radiografia */}
        <img
          src="/pan.png"
          alt="Radiografia panorâmica"
          className="absolute inset-0 h-full w-full select-none object-cover"
          draggable={false}
        />

        {/* cor da marca transparente por cima da panorâmica */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-400/25 via-cyan-400/20 to-indigo-400/30 mix-blend-overlay" />

        {/* lupa com região ampliada */}
        <div
          ref={lensRef}
          className="pointer-events-none absolute z-30 overflow-hidden rounded-full border-2 border-sky-300/70 bg-sky-400/5 shadow-[0_0_50px_rgba(56,189,248,0.5),inset_0_0_24px_rgba(2,6,23,0.6)] transition-shadow duration-300"
        >
          <div ref={innerRef} className="absolute left-0 top-0">
            <img src="/pan.png" alt="" draggable={false} className="h-full w-full select-none object-cover opacity-95" />
          </div>
          {/* anel interno e reflexo do vidro */}
          <div className="pointer-events-none absolute inset-[3px] rounded-full border border-white/25" />
          <div className="pointer-events-none absolute -left-6 -top-10 h-24 w-16 rotate-45 rounded-full bg-gradient-to-b from-white/25 to-transparent blur-sm" />
          {/* mira milimétrica */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-px bg-white/30" />
            <div className="absolute h-px w-6 bg-white/30" />
          </div>
        </div>

        {/* dica e moldura */}
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-[#05070d]/70 px-3.5 py-1.5 text-[11px] font-medium text-slate-300 shadow-lg backdrop-blur-md">
          <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse mr-2" />
          Lupa automática • Passe o mouse para controlar
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06]" />
      </div>
    </div>
  )
}

