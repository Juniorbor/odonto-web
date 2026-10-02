"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Gift,
  Crown,
  Heart,
  PartyPopper,
  Star
} from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("admin@elizdecorafestas.com.br")
  const [password, setPassword] = useState("123456")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!email || !password) {
      setError("Por favor, preencha o e-mail e a senha.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Falha na autenticação.")
      }

      setSuccess("Login efetuado com sucesso! Redirecionando...")
      setTimeout(() => {
        router.push("/app")
      }, 600)
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao tentar entrar no sistema.")
    } finally {
      setLoading(false)
    }
  }

  const fillDemoUser = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("123456")
    setError(null)
  }

  // Multi-colored Birthday Balloons Config
  const balloons = [
    { left: "6%", gradient: "from-pink-400 via-rose-500 to-pink-600", width: "w-14 sm:w-16", height: "h-18 sm:h-20", anim: "animate-balloon-rise-slow", delay: "0s", duration: "17s" },
    { left: "20%", gradient: "from-sky-400 via-blue-500 to-cyan-600", width: "w-16 sm:w-20", height: "h-20 sm:h-24", anim: "animate-balloon-rise-fast", delay: "3s", duration: "13s" },
    { left: "35%", gradient: "from-amber-300 via-yellow-400 to-amber-500", width: "w-12 sm:w-14", height: "h-16 sm:h-18", anim: "animate-balloon-rise-slow", delay: "7s", duration: "19s" },
    { left: "52%", gradient: "from-purple-400 via-fuchsia-500 to-indigo-600", width: "w-18 sm:w-22", height: "h-22 sm:h-26", anim: "animate-balloon-rise-fast", delay: "2s", duration: "15s" },
    { left: "68%", gradient: "from-emerald-300 via-teal-400 to-emerald-600", width: "w-14 sm:w-16", height: "h-18 sm:h-20", anim: "animate-balloon-rise-slow", delay: "5s", duration: "18s" },
    { left: "82%", gradient: "from-rose-400 via-pink-500 to-red-500", width: "w-16 sm:w-20", height: "h-20 sm:h-24", anim: "animate-balloon-rise-fast", delay: "9s", duration: "14s" },
    { left: "93%", gradient: "from-yellow-300 via-amber-400 to-orange-500", width: "w-12 sm:w-14", height: "h-16 sm:h-18", anim: "animate-balloon-rise-slow", delay: "1s", duration: "20s" },
    { left: "44%", gradient: "from-pink-500 via-fuchsia-600 to-purple-600", width: "w-14 sm:w-16", height: "h-18 sm:h-20", anim: "animate-balloon-rise-fast", delay: "11s", duration: "16s" },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-pink-500 selection:text-white">
      
      {/* Ambient Lighting Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />

        {/* Floating Animated Birthday Balloons Layer */}
        {balloons.map((b, idx) => (
          <div
            key={idx}
            className={`absolute bottom-0 ${b.anim} pointer-events-none drop-shadow-2xl`}
            style={{
              left: b.left,
              animationDelay: b.delay,
              animationDuration: b.duration,
            }}
          >
            <div className="relative group">
              {/* Balloon Oval Body */}
              <div
                className={`${b.width} ${b.height} bg-gradient-to-b ${b.gradient} rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-2xl relative flex items-center justify-center border border-white/20`}
              >
                {/* 3D Glossy Reflection Highlight */}
                <div className="absolute top-2 left-2.5 w-3 h-5 bg-white/45 rounded-full rotate-[-25deg] blur-[0.5px]" />
                
                {/* Subtle Inner Sparkle Icon */}
                {idx % 3 === 0 && <Star className="w-3.5 h-3.5 text-white/40" />}
                {idx % 3 === 1 && <Heart className="w-3.5 h-3.5 text-white/40 fill-white/20" />}
              </div>

              {/* Balloon Knot */}
              <div className="w-2.5 h-2 bg-gradient-to-b from-slate-800 to-black rounded-sm mx-auto -mt-0.5" />

              {/* Floating String */}
              <div className="w-0.5 h-16 bg-gradient-to-b from-white/60 via-white/20 to-transparent mx-auto" />
            </div>
          </div>
        ))}

        {/* Sparkling Stars (Brilhos e Cintilações) */}
        <div className="absolute top-12 left-12 animate-sparkle-twinkle" style={{ animationDelay: "0.2s" }}>
          <Sparkles className="w-6 h-6 text-pink-300/80" />
        </div>
        <div className="absolute top-28 right-16 animate-sparkle-twinkle" style={{ animationDelay: "1.5s" }}>
          <Star className="w-5 h-5 text-amber-300/80 fill-amber-300/40" />
        </div>
        <div className="absolute bottom-20 left-20 animate-sparkle-twinkle" style={{ animationDelay: "0.8s" }}>
          <Sparkles className="w-7 h-7 text-sky-300/80" />
        </div>
        <div className="absolute bottom-32 right-24 animate-sparkle-twinkle" style={{ animationDelay: "2.1s" }}>
          <Star className="w-6 h-6 text-fuchsia-300/80 fill-fuchsia-300/40" />
        </div>

        {/* Floating Party & Decoration Ornaments */}
        <div className="absolute top-1/4 left-10 animate-float-ornament opacity-60 hidden md:block" style={{ animationDelay: "0.4s" }}>
          <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/20 backdrop-blur-md text-pink-300 shadow-xl flex items-center gap-2 text-xs font-bold">
            <Gift className="w-5 h-5 text-pink-400" />
            <span>Kits de Festas</span>
          </div>
        </div>

        <div className="absolute top-1/3 right-10 animate-float-ornament opacity-60 hidden md:block" style={{ animationDelay: "1.8s" }}>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md text-amber-300 shadow-xl flex items-center gap-2 text-xs font-bold">
            <Crown className="w-5 h-5 text-amber-400" />
            <span>15 Anos & Premium</span>
          </div>
        </div>

        <div className="absolute bottom-1/4 left-16 animate-float-ornament opacity-60 hidden lg:block" style={{ animationDelay: "2.5s" }}>
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 backdrop-blur-md text-sky-300 shadow-xl flex items-center gap-2 text-xs font-bold">
            <PartyPopper className="w-5 h-5 text-sky-400" />
            <span>Acervo de Decorações</span>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Logo Card Top */}
        <div className="text-center space-y-3">
          <Link href="/" className="inline-block group">
            <div className="relative w-20 h-20 mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-pink-500 group-hover:scale-105 transition-transform duration-300">
              <Image 
                src="/logo.jpg" 
                alt="Eliz Decora Festas Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </Link>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Eliz Decora <span className="text-pink-500">Festas</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Sistema Web de Gestão & Decorações Premium
            </p>
          </div>
        </div>

        {/* Main Glass Form Card */}
        <div className="glass p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6 bg-slate-900/60 backdrop-blur-xl">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-pink-400" />
              Acesso ao Sistema
            </h2>
            <span className="text-xs font-black px-3 py-1 rounded-full bg-pink-500 text-white shadow-md shadow-pink-500/30 border border-pink-400 tracking-wide">
              Seguro & Encriptado
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                E-mail ou Usuário
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@elizdecorafestas.com.br"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded accent-pink-500 border-slate-700 bg-slate-900"
                />
                Lembrar acesso neste dispositivo
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-sky-500 hover:from-pink-600 hover:to-sky-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 hover:shadow-pink-500/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Access Shortcuts */}
          <div className="pt-4 border-t border-white/10 space-y-2.5">
            <span className="text-xs font-black text-slate-200 block text-center uppercase tracking-wide">
              Acesso Rápido de Testes (Clique para preencher):
            </span>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => fillDemoUser("admin@elizdecorafestas.com.br")}
                className="px-3.5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black border border-pink-400 flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-white" />
                <span>Admin Master</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoUser("gerente@elizdecorafestas.com.br")}
                className="px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black border border-sky-400 flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-white" />
                <span>Gerente</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoUser("vendedor@elizdecorafestas.com.br")}
                className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-300 flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-slate-950" />
                <span>Vendedor</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoUser("funcionario@elizdecorafestas.com.br")}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black border border-emerald-400 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-white" />
                <span>Funcionário</span>
              </button>
            </div>
          </div>

        </div>

        <div className="text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-pink-400 transition-colors">
            ← Voltar para a Página Inicial
          </Link>
        </div>

      </div>
    </div>
  )
}
