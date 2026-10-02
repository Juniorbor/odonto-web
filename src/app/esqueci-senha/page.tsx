"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-xl border border-pink-500">
            <Image src="/logo.jpg" alt="Eliz Decora Festas" fill className="object-cover" />
          </div>
          <h1 className="text-xl font-bold text-white">Recuperação de Senha</h1>
          <p className="text-xs text-slate-400">Eliz Decora Festas</p>
        </div>

        <div className="glass p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">E-mail Enviado!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Enviamos as instruções de redefinição de senha para <strong className="text-pink-400">{email}</strong>. Verifique sua caixa de entrada e spams.
              </p>
              <Link
                href="/login"
                className="inline-block pt-2 text-xs text-pink-400 hover:underline font-semibold"
              >
                Voltar ao Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-300">
                Informe o seu e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">E-mail Cadastrado</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@elizdecorafestas.com.br"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700 rounded-2xl text-sm text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-sm shadow-lg shadow-pink-500/20 transition-all cursor-pointer"
              >
                {loading ? "Enviando..." : "Enviar Instruções de Recuperação"}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link href="/login" className="text-xs text-slate-400 hover:text-pink-400 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar para a tela de login
          </Link>
        </div>
      </div>
    </div>
  )
}