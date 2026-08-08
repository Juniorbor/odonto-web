"use client"

import { useEffect, useRef, useState } from "react"
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
      router.push(data.isAdminMaster ? "/admin" : "/app")
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
      <div className="anim-float pointer-events-none absolute -left-24 top-16 hidden h-72 w-72 rounded-full bg-sky-500/10 blur-3xl lg:block" />
      <div
        className="anim-float pointer-events-none absolute -right-24 bottom-16 hidden h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl lg:block"
        style={{ animationDelay: "2s" }}
      />

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

        {/* Coluna direita: radiografia panorâmica 3D */}
        <div className="relative hidden overflow-hidden border-l border-[#16213a] bg-gradient-to-br from-[#0a1424] to-[#060b14] lg:block">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
          <RadiographScene />
        </div>
      </div>
    </div>
  )
}

/* ---------- Radiografia panorâmica com lupa e números financeiros ---------- */

const FINANCE_NUMBERS = [
  { value: "94.320", top: "6%", left: "5%", size: "text-xl", delay: "0s", dur: "30s" },
  { value: "12.480", top: "12%", right: "7%", size: "text-lg", delay: "3s", dur: "34s" },
  { value: "3.215", bottom: "26%", right: "13%", size: "text-lg", delay: "6s", dur: "28s" },
  { value: "1.240.900", bottom: "16%", right: "5%", size: "text-xl", delay: "1.5s", dur: "32s" },
  { value: "128", bottom: "8%", left: "9%", size: "text-lg", delay: "8s", dur: "26s" },
]

const PANO_ASPECT = 1.894
const LUPA_WIDTH_FRAC = 0.18
const LUPA_ZOOM = 2.6

function RadiographScene() {
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    let raf = 0
    const start = performance.now()

    const step = (now: number) => {
      const w = stage.clientWidth
      const h = stage.clientHeight
      const lens = Math.min(w * LUPA_WIDTH_FRAC, h * 0.36)
      const half = lens / 2
      const pad = lens * 0.15
      const xMin = half + pad
      const xMax = w - half - pad
      const yMin = half + pad
      const yMax = h - half - pad
      const cx = (xMin + xMax) / 2
      const cy = (yMin + yMax) / 2
      const ax = (xMax - xMin) / 2
      const ay = (yMax - yMin) / 2
      const t = (now - start) / 1000
      const lx = cx + ax * Math.sin(t * 0.55)
      const ly = cy + ay * Math.sin(t * 0.37 + 1.3)
      stage.style.setProperty("--lx", `${lx}px`)
      stage.style.setProperty("--ly", `${ly}px`)
      stage.style.setProperty("--lens", `${lens}px`)
      stage.style.setProperty("--loff", `${(half * (LUPA_ZOOM - 1))}px`)
      stage.style.setProperty("--cw", `${w * LUPA_ZOOM}px`)
      stage.style.setProperty("--ch", `${h * LUPA_ZOOM}px`)
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="relative flex h-full min-h-[560px] items-center justify-center px-1 py-2">
      <div ref={stageRef} className="pano-stage relative w-full overflow-hidden rounded-2xl border border-[#23345a] bg-[#0a101c] shadow-2xl" style={{ aspectRatio: String(PANO_ASPECT) }}>
        {/* radiografia */}
          <img
            src="/pan.png"
            alt="Radiografia panorâmica"
            className="absolute inset-0 h-full w-full select-none object-cover"
            draggable={false}
          />

          {/* brilho no canto (pulso suave) */}
          <div className="pano-glow pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="pano-glow pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" style={{ animationDelay: "2.4s" }} />

          {/* linha de varredura */}
          <div className="pano-scan pointer-events-none absolute top-0 h-full w-16 bg-gradient-to-r from-transparent via-sky-300/20 to-transparent" />

          {/* números financeiros deslizando lentamente sobre a radiografia */}
          {FINANCE_NUMBERS.map((n) => (
            <div
              key={n.value}
              className="pano-num pointer-events-none absolute z-20 select-none"
              style={{
                top: n.top,
                bottom: n.bottom,
                left: n.left,
                right: n.right,
                animationDuration: n.dur,
                animationDelay: n.delay,
              }}
            >
              <p className={`${n.size} font-black tracking-tight text-white/50 drop-shadow-[0_2px_12px_rgba(2,6,23,0.9)]`}>
                {n.value}
              </p>
            </div>
          ))}

          {/* lupa com região ampliada */}
          <div
            className="pano-lupa pointer-events-none absolute z-30 overflow-hidden rounded-full border-2 border-sky-300/70 bg-sky-400/5 shadow-[0_0_50px_rgba(56,189,248,0.5),inset_0_0_24px_rgba(2,6,23,0.6)]"
            style={{
              width: "var(--lens)",
              height: "var(--lens)",
              left: "var(--lx, 20px)",
              top: "var(--ly, 20px)",
            }}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: "var(--cw)",
                height: "var(--ch)",
                transform: `translate(calc(-${LUPA_ZOOM} * var(--lx, 20px) - var(--loff)), calc(-${LUPA_ZOOM} * var(--ly, 20px) - var(--loff)))`,
              }}
            >
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

          {/* moldura sutil */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06]" />
        </div>
    </div>
  )
}
