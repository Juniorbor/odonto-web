"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, ArrowRight } from "lucide-react"
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
    <div className="bg-glow relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="anim-float pointer-events-none absolute -left-24 top-16 hidden h-72 w-72 rounded-full bg-sky-500/10 blur-3xl lg:block" />
      <div className="anim-float pointer-events-none absolute -right-24 bottom-16 hidden h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl lg:block" style={{ animationDelay: "2s" }} />

      <div className="anim-fade-up relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#1c2942] shadow-2xl lg:grid-cols-2">
        {/* Painel de marca */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-[#0a1424] to-[#060b14] p-10 lg:flex">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex items-center gap-3">
            <ToothLogo boxClassName="h-11 w-11 rounded-2xl" />
            <div>
              <p className="text-lg font-bold text-white">
                <span className="text-gradient">Odonto</span>Cloud
              </p>
              <p className="text-[11px] text-slate-500">Plataforma odontológica profissional</p>
            </div>
          </div>

          <div className="relative space-y-6">
            <h1 className="text-3xl font-bold leading-tight text-white">
              Sua clínica odontológica <span className="text-gradient">completa</span> em um só lugar.
            </h1>
            <p className="text-sm leading-relaxed text-slate-400">
              Pacientes, anamnese, odontograma, radiografias, inteligência artificial, produção e
              financeiro — com segurança e privacidade de dados.
            </p>

            <div className="space-y-3">
              {[
                { icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />, text: "Dados protegidos com LGPD e criptografia" },
                { icon: <Sparkles className="h-4 w-4 text-cyan-400" />, text: "Assistente de IA para apoio clínico" },
                { icon: <ArrowRight className="h-4 w-4 text-sky-400" />, text: "Relatórios profissionais em PDF" },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2.5 text-sm text-slate-300">
                  {f.icon}
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-[11px] text-slate-600">
            © {new Date().getFullYear()} OdontoCloud — Tecnologia + Odontologia + Segurança
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-[#0b1220]/90 p-8 backdrop-blur-xl sm:p-10">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <ToothLogo boxClassName="h-10 w-10 rounded-xl" />
              <p className="text-lg font-bold text-white">
                <span className="text-gradient">Odonto</span>Cloud
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">Acessar plataforma</h2>
          <p className="mt-1 text-sm text-slate-500">Entre com suas credenciais profissionais.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
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
      </div>
    </div>
  )
}