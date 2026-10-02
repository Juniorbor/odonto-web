"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Sparkles, 
  PartyPopper, 
  ChevronRight, 
  Calendar, 
  Award, 
  Smile, 
  Star, 
  ArrowRight,
  Heart,
  Package,
  Layers,
  PhoneCall,
  CheckCircle2,
  Lock
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-pink-500 selection:text-white">
      {/* Dynamic Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-pink-300/40 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-sky-300/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 sticky top-0 backdrop-blur-md bg-white/80 border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300 border-2 border-pink-400">
              <Image 
                src="/logo.jpg" 
                alt="Eliz Decora Festas Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-none">
                Eliz Decora <span className="text-pink-600">Festas</span>
              </span>
              <span className="text-xs text-sky-600 font-medium tracking-wide">
                Decorações & Eventos Premium
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-bold text-slate-900 text-sm">
            <a href="#catálogo" className="hover:text-pink-600 transition-colors">Catálogo Digital</a>
            <a href="#diferenciais" className="hover:text-pink-600 transition-colors">Diferenciais</a>
            <a href="#depoimentos" className="hover:text-pink-600 transition-colors">Depoimentos</a>
            <Link href="/contato" className="hover:text-pink-600 transition-colors">Contato & Serviços</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-sky-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all text-sm"
            >
              <Lock className="w-4 h-4" />
              Entrar no Sistema
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100/80 border border-pink-200 text-pink-700 text-xs font-bold tracking-wide shadow-sm animate-bounce">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Decoração de Eventos Inesquecíveis
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Transformando momentos especiais em{" "}
                <span className="ez-gradient-text">experiências inesquecíveis.</span>
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Sistema comercial completo de alta performance para ornamentação, balões desconstruídos, flores nobres, painéis 3D, projetos visuais e gestão impecável de festas.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-base shadow-xl shadow-pink-500/30 hover:scale-[1.02] active:scale-98 transition-all"
                >
                  <PartyPopper className="w-5 h-5" />
                  Entrar no Sistema
                </Link>

                <Link
                  href="/contato"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border-2 border-slate-200 shadow-md hover:border-pink-300 transition-all"
                >
                  Conheça nossos serviços
                  <ArrowRight className="w-5 h-5 text-pink-600" />
                </Link>
              </div>

              {/* Badges / Stats */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center lg:text-left">
                <div>
                  <div className="text-2xl font-black text-slate-900">+500</div>
                  <div className="text-xs text-slate-500 font-medium">Festas Realizadas</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">100%</div>
                  <div className="text-xs text-slate-500 font-medium">Clientes Satisfeitos</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">3D</div>
                  <div className="text-xs text-slate-500 font-medium">Projetos Visuais</div>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Card 3D Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* 3D Floating Decorative Balloon */}
                <div className="absolute -top-10 -right-6 z-20 animate-float-balloon">
                  <div className="w-20 h-24 bg-gradient-to-b from-pink-400 to-pink-600 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-xl flex items-center justify-center text-white relative">
                    <Heart className="w-8 h-8 fill-white/30" />
                    <div className="absolute -bottom-2 w-1 h-8 bg-pink-400/60 left-1/2 -translate-x-1/2" />
                  </div>
                </div>

                {/* Main Showcase Image Card 3D */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white p-3 transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 card-3d">
                  <div className="relative h-96 sm:h-[450px] rounded-2xl overflow-hidden">
                    <Image
                      src="/eliz_decora_logo.jpg"
                      alt="Eliz Decora Festas Identidade Visual"
                      fill
                      className="object-contain bg-slate-50 p-4"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                      <div className="inline-flex items-center gap-1 text-xs font-semibold bg-pink-500/90 backdrop-blur-sm px-3 py-1 rounded-full w-fit mb-2">
                        <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        Decoração Oficial Premium
                      </div>
                      <h3 className="text-xl font-bold">Painéis, Arcos & Ornamentação</h3>
                      <p className="text-xs text-slate-200">Catálogo digital interativo com simulação visual para o cliente.</p>
                    </div>
                  </div>
                </div>

                {/* Secondary Floating Card */}
                <div className="absolute -bottom-6 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-pink-100 flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Projeto de Decoração</div>
                    <div className="text-[11px] text-slate-500">Orçamentos gerados em PDF</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Catalog & Services Showcase */}
      <section id="catálogo" className="py-16 bg-white relative z-10 border-t border-pink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Especialidades em <span className="text-pink-600">Decoração & Eventos</span>
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Oferecemos um acervo completo de produtos e serviços para transformar a sua celebração em um espetáculo inesquecível.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Balões Orgânicos",
                desc: "Arcos desconstruídos, esculturas gigantes e arranjos com cores vibrantes.",
                icon: PartyPopper,
                color: "bg-pink-500",
                img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&auto=format&fit=crop&q=80"
              },
              {
                title: "Flores & Arranjos",
                desc: "Arranjos naturais e desidratados para mesas principais e cenários.",
                icon: Heart,
                color: "bg-rose-500",
                img: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=80"
              },
              {
                title: "Painéis 3D & Cenários",
                desc: "Painéis sublimados, arcos romanos, cilindros e biombos temáticos.",
                icon: Layers,
                color: "bg-sky-500",
                img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&auto=format&fit=crop&q=80"
              },
              {
                title: "Iluminação & Neon",
                desc: "Letreiros em neon flex, refletores LED direcionais e iluminação cênica.",
                icon: Sparkles,
                color: "bg-amber-500",
                img: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=80"
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 group hover:-translate-y-2">
                <div className="relative h-48 overflow-hidden">
                  <Image 
                    src={item.img} 
                    alt={item.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/10 transition-colors" />
                  <span className={`absolute top-4 right-4 p-2.5 rounded-xl ${item.color} text-white shadow-lg`}>
                    <item.icon className="w-5 h-5" />
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentials */}
      <section id="diferenciais" className="py-16 bg-slate-100/70 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-pink-100 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Gestão 100% Integrada</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Do cadastro do cliente à montagem do evento, controle estoque, orçamentos, vendas e financeiro em uma única plataforma.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-sky-100 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-6">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Reserva Automática de Estoque</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Ao aprovar um orçamento ou fechar um contrato, os itens da decoração são automaticamente reservados na agenda.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-amber-100 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Compartilhamento no WhatsApp</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Envie o projeto visual da decoração e os orçamentos em PDF com um único clique direto para o WhatsApp do cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-pink-600 via-rose-600 to-sky-600 text-white relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Pronto para transformar sua empresa de eventos?
          </h2>
          <p className="text-pink-100 mt-3 text-base max-w-2xl mx-auto">
            Acesse o sistema web comercial da Eliz Decora Festas e gerencie orçamentos, estoque e decorações com praticidade.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-pink-600 font-bold text-base shadow-2xl hover:bg-slate-100 hover:scale-105 transition-all"
            >
              <Lock className="w-5 h-5" />
              Acessar o Sistema Agora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-pink-500">
              <Image src="/logo.jpg" alt="Eliz Decora Festas Logo" fill className="object-cover" />
            </div>
            <span className="font-bold text-white">Eliz Decora Festas</span>
          </div>
          <p>© {new Date().getFullYear()} Eliz Decora Festas. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/contato" className="hover:text-pink-400 transition-colors">Contato</Link>
            <Link href="/login" className="hover:text-pink-400 transition-colors">Área Restrita</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
