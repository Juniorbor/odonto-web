import Link from "next/link"
import { ArrowLeft, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardBody, CardHeader } from "@/components/ui/card"
import { ToothLogo } from "@/components/ui/tooth-logo"
import { InstagramIcon } from "@/components/icons/instagram"

const WA_DIGITS = process.env.NEXT_PUBLIC_WHATSAPP ?? ""
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contato@odontocloud.com.br"
const INSTAGRAM = process.env.NEXT_PUBLIC_INSTAGRAM ?? ""

function waLink(message: string) {
  const digits = WA_DIGITS.replace(/\D/g, "")
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

function maskPhone(raw: string) {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 13) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  if (digits.length === 12) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
  return raw
}

export default function ContatoPage() {
  const waDigits = WA_DIGITS.replace(/\D/g, "")
  const hasWhatsApp = /^\d{10,15}$/.test(waDigits)

  return (
    <div className="bg-glow relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="anim-float pointer-events-none absolute -left-24 top-16 hidden h-72 w-72 rounded-full bg-sky-500/10 blur-3xl lg:block" />
      <div
        className="anim-float pointer-events-none absolute -right-24 bottom-16 hidden h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl lg:block"
        style={{ animationDelay: "2s" }}
      />

      <div className="anim-fade-up relative z-10 w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <ToothLogo boxClassName="h-11 w-11 rounded-2xl" />
          <div>
            <p className="text-lg font-bold text-white">
              <span className="text-gradient">Odonto</span>web
            </p>
            <p className="text-[11px] text-slate-500">Fale com a nossa equipe comercial</p>
          </div>
        </div>

        <Card>
          <CardHeader title="Contato comercial" subtitle="Escolha o canal de sua preferência." />
          <CardBody>
            <div className="space-y-3">
              {hasWhatsApp ? (
                <a
                  href={waLink("Olá! Gostaria de conhecer a plataforma OdontoWeb.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3.5 transition hover:border-emerald-400/50 hover:bg-emerald-500/15"
                >
                  <MessageCircle className="h-5 w-5 shrink-0 text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">WhatsApp</p>
                    <p className="text-xs text-slate-400">{maskPhone(waDigits)}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-[#23345a] bg-[#0a1120] px-4 py-3.5">
                  <MessageCircle className="h-5 w-5 shrink-0 text-slate-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-300">WhatsApp</p>
                    <p className="text-xs text-slate-500">Em breve disponível nesta instalação.</p>
                  </div>
                </div>
              )}

              {INSTAGRAM && (
                <a
                  href={INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-pink-500/30 bg-pink-500/10 px-4 py-3.5 transition hover:border-pink-400/50 hover:bg-pink-500/15"
                >
                  <InstagramIcon className="h-5 w-5 shrink-0 text-pink-400" />
                  <div>
                    <p className="text-sm font-semibold text-pink-300">Instagram</p>
                    <p className="text-xs text-slate-400">Acompanhe nossas novidades.</p>
                  </div>
                </a>
              )}

              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3.5 transition hover:border-sky-400/50 hover:bg-sky-500/15"
              >
                <Mail className="h-5 w-5 shrink-0 text-sky-400" />
                <div>
                  <p className="text-sm font-semibold text-sky-300">E-mail</p>
                  <p className="text-xs text-slate-400">{EMAIL}</p>
                </div>
              </a>
            </div>

            <Link href="/" className="mt-6 block">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao login
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}