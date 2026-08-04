"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Field } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { ToothLogo } from "@/components/ui/tooth-logo"

function ResetForm() {
  const router = useRouter()
  const { toast } = useToast()
  const params = useSearchParams()
  const token = params.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDone(true)
      toast("Senha redefinida com sucesso!", "success")
      setTimeout(() => router.push("/app"), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-white">Senha redefinida!</h1>
        <p className="mt-3 text-sm text-slate-400">Redirecionando para a plataforma...</p>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white">Definir nova senha</h1>
      <p className="mt-1 text-sm text-slate-500">Crie uma nova senha para acessar sua conta.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field label="Nova senha" required>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <Input
              type={show ? "text" : "password"}
              required
              placeholder="Mínimo 6 caracteres"
              className="pl-10 pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-300"
              aria-label="Mostrar senha"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <Field label="Confirmar nova senha" required>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <Input
              type={show ? "text" : "password"}
              required
              placeholder="Repita a senha"
              className="pl-10"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </Field>
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Redefinir senha
        </Button>
      </form>
      <div className="mt-6 text-center">
        <Link href="/login" className="text-sm text-slate-400 transition hover:text-sky-300">
          Voltar para o login
        </Link>
      </div>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-glow relative flex min-h-screen items-center justify-center px-4">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
      <div className="anim-fade-up relative z-10 w-full max-w-md rounded-3xl border border-[#1c2942] bg-[#0b1220]/90 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <ToothLogo boxClassName="h-10 w-10 rounded-xl" />
          <p className="text-lg font-bold text-white">
            <span className="text-gradient">Odonto</span>Cloud
          </p>
        </div>
        <Suspense fallback={<p className="py-10 text-center text-sm text-slate-500">Carregando...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}