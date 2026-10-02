"use client"

import React from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Sparkles, 
  ArrowLeft,
  Globe,
  Share2,
  CheckCircle,
  Calendar
} from "lucide-react"

export default function InstitutionalPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-pink-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-pink-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <ArrowLeft className="w-5 h-5 text-slate-600 hover:text-pink-600 transition-colors" />
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md border border-pink-400">
              <Image src="/logo.jpg" alt="Eliz Decora Festas" fill className="object-cover" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 block leading-none">
                Eliz Decora <span className="text-pink-600">Festas</span>
              </span>
              <span className="text-xs text-sky-600">Apresentação Institucional</span>
            </div>
          </Link>

          <a
            href="https://wa.me/5511988887777?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento%20de%20decoração."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold text-xs shadow-md hover:bg-emerald-700 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Falar no WhatsApp
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-white border-b border-pink-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-pink-500" />
              ELIZ DECORA FESTAS
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              "Transformando momentos especiais em <span className="ez-gradient-text">experiências inesquecíveis."</span>
            </h1>
            <p className="text-slate-600 text-base leading-relaxed">
              Somos uma empresa especializada em projetos de decoração, ornamentação e consultoria completa para eventos sociais e corporativos.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-12">
            Tipos de Eventos Atendidos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Casamentos & Noivados",
                desc: "Passarelas de cerimonial, altares floridos, pergolados de madeira e mesas de bolo luxuosas.",
                img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&auto=format&fit=crop&q=80"
              },
              {
                title: "Festas de 15 Anos",
                desc: "Cenários fotográficos 3D, iluminação neon personalizada e túneis de balões desconstruídos.",
                img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80"
              },
              {
                title: "Aniversários Infantis",
                desc: "Mesas temáticas, personagens em tamanho real, arcos coloridos e descartáveis personalizados.",
                img: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80"
              },
              {
                title: "Chá de Bebê & Revelação",
                desc: "Decorações delicadas com tons pastéis, arranjos de flores secas e cenários instagramáveis.",
                img: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80"
              },
              {
                title: "Eventos Corporativos",
                desc: "Backdrops com marca da empresa, arranjos para palco, credenciamento e coquetéis sofisticados.",
                img: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80"
              },
              {
                title: "Formaturas & Confraternizações",
                desc: "Iluminação cênica de impacto, varais de luzes LED e estruturas monumentais.",
                img: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80"
              }
            ].map((service, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                <div className="relative h-48">
                  <Image src={service.img} alt={service.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-slate-900">{service.title}</h3>
                  <p className="text-slate-600 text-xs mt-2 leading-relaxed">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Social Section */}
      <section className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Contact Info */}
            <div className="space-y-6">
              <h2 className="text-3xl font-extrabold text-slate-900">Entre em Contato</h2>
              <p className="text-slate-600 text-sm">
                Fale diretamente com nossa equipe de atendimento para agendar uma reunião presencial ou receber uma proposta personalizada.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Telefone / WhatsApp</div>
                    <div className="text-sm font-bold text-slate-900">(11) 98888-7777</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">E-mail Comercial</div>
                    <div className="text-sm font-bold text-slate-900">contato@elizdecorafestas.com.br</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-medium">Showroom & Escritório</div>
                    <div className="text-sm font-bold text-slate-900">Av. das Festas, 1000 - São Paulo, SP</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500">Siga nossas redes:</span>
                <a href="#" className="p-2.5 rounded-full bg-slate-100 text-pink-600 hover:bg-pink-100 transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
                <a href="#" className="p-2.5 rounded-full bg-slate-100 text-sky-600 hover:bg-sky-100 transition-colors">
                  <Share2 className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Right WhatsApp Box */}
            <div className="bg-gradient-to-br from-pink-50 via-slate-50 to-sky-50 p-8 rounded-3xl border border-pink-200 shadow-xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <MessageCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Atendimento Rápido via WhatsApp</h3>
                <p className="text-slate-600 text-xs mt-1">
                  Respostas imediatas para orçamentos e disponibilidade de datas na agenda.
                </p>
              </div>

              <a
                href="https://wa.me/5511988887777?text=Olá!%20Vim%20pelo%20site%20da%20Ez%20Decora%20Festas%20e%20gostaria%20de%20mais%20informações."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg transition-all"
              >
                Iniciar Conversa no WhatsApp
              </a>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}