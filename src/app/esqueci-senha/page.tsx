"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Field } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { ToothLogo } from "@/components/ui/tooth-logo"

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast(data.message, "info")
      setSent(data.devResetUrl ?? "sent")
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao enviar instruções.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-glow relative flex min-h-screen items-center justify-center px-4">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="anim-fade-up relative z-10 w-full max-w-md rounded-3xl border border-[#1c2942] bg-[#0b1220]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <ToothLogo boxClassName="h-10 w-10 rounded-xl" />
          <p className="text-lg font-bold text-white">
            <span className="text-gradient">Odonto</span>web
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <KeyRound className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold text-white">Instruções enviadas</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Se o e-mail existir em nossa base, você receberá um link para redefinir sua senha.
              <br />
              <span className="text-xs text-slate-600">O link expira em 30 minutos.</span>
            </p>
            {sent !== "sent" && (
              <Link
                href={sent}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Abrir link de redefinição
              </Link>
            )}
            <div className="mt-6">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-sky-300">
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
            <p className="mt-1 text-sm text-slate-500">
              Informe seu e-mail cadastrado para receber as instruções.
            </p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              <Field label="E-mail" required>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <Input
                    type="email"
                    required
                    placeholder="voce@clinica.com.br"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </Field>
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Enviar instruções
              </Button>
            </form>
            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-sky-300">
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}