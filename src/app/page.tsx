"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  ScanLine,
  BarChart3,
  Smile,
  ArrowRight,
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

      <div className="anim-fade-up relative z-10 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-[#1c2942] bg-[#0b1220]/90 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
        {/* Coluna esquerda: formulário de login */}
        <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-14">
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

        {/* Coluna direita: dente 3D */}
        <div className="relative hidden overflow-hidden border-l border-[#16213a] bg-gradient-to-br from-[#0a1424] to-[#060b14] lg:block">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
          <Tooth3D />
        </div>
      </div>
    </div>
  )
}

function Tooth3D() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: py * -14, y: px * 16 })
  }

  return (
    <div
      className="relative flex h-full min-h-[620px] items-center justify-center"
      onMouseMove={handleMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false)
        setTilt({ x: 0, y: 0 })
      }}
      style={{ perspective: "1400px" }}
    >
      {/* brilho de fundo */}
      <div className="absolute h-80 w-80 rounded-full bg-sky-500/25 blur-3xl" style={{ transform: "translateZ(-140px)" }} />
      <div
        className="absolute h-52 w-52 rounded-full bg-cyan-400/15 blur-2xl"
        style={{ transform: "translateZ(-70px)", animationDelay: "1.4s" }}
      />

      {/* anéis de profundidade */}
      <div className="anim-spin-slow absolute h-[28rem] w-[28rem] rounded-full border border-sky-500/15" style={{ transform: "translateZ(-80px)" }}>
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-sky-400 shadow-glow" />
        <span className="absolute bottom-8 left-4 h-1.5 w-1.5 rounded-full bg-cyan-400" />
      </div>
      <div
        className="anim-float absolute h-80 w-80 rounded-full border border-dashed border-cyan-400/15"
        style={{ transform: "translateZ(-40px)", animationDelay: "1.2s" }}
      />

      {/* dente real girando em 360° */}
      <div className="anim-float relative z-10" style={{ animationDelay: "0.5s" }}>
        <div
          style={{
            transform: `perspective(1400px) rotateX(${-12 + tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
            transition: hovering
              ? "transform 0.15s ease-out"
              : "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "transform",
          }}
        >
          <div
            className="anim-spin-y relative"
            style={{ width: 264, height: 264, transformStyle: "preserve-3d" }}
          >
            {/* profundidade difusa (volume suave, sem fatias) */}
            <div
              className="absolute inset-0 opacity-40 blur-[10px]"
              style={{ transform: "translateZ(-48px)" }}
            >
              <img
                src="/DENTE.png"
                alt=""
                draggable={false}
                className="h-full w-full select-none object-contain"
                style={{ filter: "brightness(0.55)" }}
              />
            </div>
            {/* face frontal (imagem completa) */}
            <div
              className="absolute inset-0"
              style={{ transform: "translateZ(2px)", backfaceVisibility: "hidden" }}
            >
              <img
                src="/DENTE.png"
                alt="Dente em 3D"
                draggable={false}
                className="h-full w-full select-none object-contain"
              />
            </div>
            {/* face traseira espelhada — completa na volta */}
            <div
              className="absolute inset-0"
              style={{ transform: "rotateY(180deg) translateZ(2px)", backfaceVisibility: "hidden" }}
            >
              <img
                src="/DENTE.png"
                alt=""
                draggable={false}
                className="h-full w-full select-none object-contain"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* chips flutuantes em 3D */}
      <div
        className="anim-float absolute -left-6 top-16 z-30 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 shadow-xl backdrop-blur"
        style={{ transform: "translateZ(75px)", animationDelay: "1.6s" }}
      >
        <ScanLine className="h-6 w-6 text-cyan-400" />
      </div>
      <div
        className="anim-float absolute -right-4 top-24 z-30 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 shadow-xl backdrop-blur"
        style={{ transform: "translateZ(85px)", animationDelay: "2.1s" }}
      >
        <Sparkles className="h-6 w-6 text-indigo-400" />
      </div>
      <div
        className="anim-float absolute -left-8 bottom-24 z-30 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 shadow-xl backdrop-blur"
        style={{ transform: "translateZ(65px)", animationDelay: "0.9s" }}
      >
        <BarChart3 className="h-6 w-6 text-emerald-400" />
      </div>
      <div
        className="anim-float absolute -right-8 bottom-32 z-30 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 shadow-xl backdrop-blur"
        style={{ transform: "translateZ(70px)", animationDelay: "2.6s" }}
      >
        <Smile className="h-6 w-6 text-sky-400" />
      </div>

      {/* selo de segurança */}
      <div
        className="absolute -bottom-14 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-[#1c2942] bg-[#0c1322]/90 px-4 py-2.5 shadow-xl backdrop-blur"
        style={{ transform: "translateZ(60px)" }}
      >
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-medium text-slate-300">Dados protegidos com LGPD</span>
      </div>

      {/* sombra no chão */}
      <div
        className="absolute -bottom-28 left-1/2 h-12 w-72 rounded-[100%] bg-sky-500/25 blur-2xl"
        style={{ transform: `translateZ(-20px) translateX(-50%) scaleX(${1 - Math.abs(tilt.y) / 60})` }}
      />
    </div>
  )
}
