import Link from "next/link"
import {
  Smile,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Users,
  ScanLine,
  ClipboardList,
  Wallet,
  Briefcase,
  BarChart3,
  CalendarDays,
  Camera,
  MessageCircle,
  ChevronRight,
  Stethoscope,
  FileText,
  Fingerprint,
  Cpu,
} from "lucide-react"
import { Badge } from "@/components/ui/card"
import { InstagramIcon } from "@/components/icons/instagram"
import { ToothLogo } from "@/components/ui/tooth-logo"

const FEATURES = [
  {
    icon: <Users className="h-5 w-5" />,
    title: "Pacientes & Prontuário",
    desc: "Cadastro completo, prontuário eletrônico, anamnese detalhada e histórico clínico por paciente.",
  },
  {
    icon: <Smile className="h-5 w-5" />,
    title: "Odontograma Interativo",
    desc: "Arcadas superior e inferior com numeração FDI, superfícies selecionáveis e legenda de condições.",
  },
  {
    icon: <ScanLine className="h-5 w-5" />,
    title: "Radiografias & Editor",
    desc: "Panorâmicas, periapicais e tomografias com zoom, ajustes e camada de anotações — sem destruir o original.",
  },
  {
    icon: <Camera className="h-5 w-5" />,
    title: "Fotografia Clínica",
    desc: "Fotos extraorais e intraorais por categoria, com captura pela câmera e comparação antes/depois.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Inteligência Artificial",
    desc: "Assistente que organiza o raciocínio clínico, resume anamnese e alerta interações — sempre como apoio ao CD.",
  },
  {
    icon: <Briefcase className="h-5 w-5" />,
    title: "Produção Pessoal",
    desc: "Controle de tomos, traçados e serviços por profissional, cidade e região, com importação de planilhas.",
  },
  {
    icon: <Wallet className="h-5 w-5" />,
    title: "Financeiro Pessoal",
    desc: "Entradas, despesas fixas e variáveis, parcelamentos automáticos, saldo mensal e acumulado.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Relatórios & PDFs",
    desc: "Relatórios clínicos, de produção e financeiros com prévia, impressão e download em PDF profissional.",
  },
  {
    icon: <CalendarDays className="h-5 w-5" />,
    title: "Agenda Odontológica",
    desc: "Visão por dia, semana ou mês com status de cada consulta: agendado, confirmado, concluído ou faltou.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Segurança & LGPD",
    desc: "Isolamento entre clientes, auditoria completa, consentimentos e exportação de dados sob demanda.",
  },
  {
    icon: <Fingerprint className="h-5 w-5" />,
    title: "Auditoria Completa",
    desc: "Logs de login, alterações, uploads, downloads e uso da IA — com usuário, data e registro afetado.",
  },
  {
    icon: <Stethoscope className="h-5 w-5" />,
    title: "Atendimento Clínico",
    desc: "Queixa principal, exame, hipóteses, procedimentos, evolução e retorno — tudo em ordem cronológica.",
  },
]

const PLANS = [
  {
    name: "Básico",
    price: "R$ 99",
    period: "/mês",
    desc: "Para começar a organizar a clínica",
    features: ["Pacientes ilimitados", "Anamnese completa", "Atendimentos e prontuário", "Agenda"],
    highlight: false,
  },
  {
    name: "Profissional",
    price: "R$ 199",
    period: "/mês",
    desc: "O pacote mais completo para consultórios",
    features: [
      "Tudo do Básico",
      "Odontograma interativo",
      "Radiografias + editor",
      "Fotografia clínica",
      "Relatórios em PDF",
      "Assistente de IA",
    ],
    highlight: true,
  },
  {
    name: "Premium",
    price: "R$ 349",
    period: "/mês",
    desc: "Gestão completa com IA avançada",
    features: [
      "Tudo do Profissional",
      "Produção pessoal + Excel",
      "Financeiro completo",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    highlight: false,
  },
]

function ToothHero() {
  return (
    <div className="relative mx-auto flex h-[340px] w-full max-w-md items-center justify-center sm:h-[420px]">
      {/* anéis */}
      <div className="anim-float absolute h-56 w-56 rounded-full border border-sky-500/20 sm:h-72 sm:w-72" />
      <div className="anim-float absolute h-72 w-72 rounded-full border border-dashed border-cyan-400/15 sm:h-96 sm:w-96" style={{ animationDelay: "1.2s" }} />
      <div className="anim-spin-slow absolute h-80 w-80 rounded-full border border-sky-500/10 sm:h-[26rem] sm:w-[26rem]">
        <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-sky-400 shadow-glow" />
        <span className="absolute bottom-8 left-4 h-1.5 w-1.5 rounded-full bg-cyan-400" />
        <span className="absolute right-6 top-16 h-1.5 w-1.5 rounded-full bg-indigo-400" />
      </div>

      {/* dente principal */}
      <div className="anim-float relative z-10" style={{ animationDelay: "0.5s" }}>
        <svg viewBox="0 0 200 220" className="h-56 w-52 drop-shadow-[0_18px_40px_rgba(14,165,233,0.35)] sm:h-64 sm:w-60">
          <defs>
            <linearGradient id="toothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="45%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <radialGradient id="toothGloss" cx="30%" cy="25%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.15" />
            </radialGradient>
          </defs>
          <path
            d="M100 12
               C 128 12, 152 40, 150 78
               C 148 104, 158 126, 164 150
               C 170 176, 158 202, 138 204
               C 122 206, 116 184, 100 184
               C 84 184, 78 206, 62 204
               C 42 202, 30 176, 36 150
               C 42 126, 52 104, 50 78
               C 48 40, 72 12, 100 12 Z"
            fill="url(#toothGrad)"
          />
          <path
            d="M100 12
               C 128 12, 152 40, 150 78
               C 148 104, 158 126, 164 150
               C 170 176, 158 202, 138 204
               C 122 206, 116 184, 100 184
               C 84 184, 78 206, 62 204
               C 42 202, 30 176, 36 150
               C 42 126, 52 104, 50 78
               C 48 40, 72 12, 100 12 Z"
            fill="url(#toothGloss)"
          />
          <path d="M100 12 C 112 40, 112 70, 104 92" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
        </svg>
      </div>

      {/* elementos flutuantes */}
      <div className="anim-float absolute left-0 top-10 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 shadow-xl backdrop-blur" style={{ animationDelay: "1.6s" }}>
        <ScanLine className="h-6 w-6 text-cyan-400" />
      </div>
      <div className="anim-float absolute right-0 top-16 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 shadow-xl backdrop-blur" style={{ animationDelay: "2.1s" }}>
        <Sparkles className="h-6 w-6 text-indigo-400" />
      </div>
      <div className="anim-float absolute bottom-6 left-6 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 shadow-xl backdrop-blur" style={{ animationDelay: "0.9s" }}>
        <BarChart3 className="h-6 w-6 text-emerald-400" />
      </div>
      <div className="anim-float absolute bottom-10 right-8 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 shadow-xl backdrop-blur" style={{ animationDelay: "2.6s" }}>
        <ShieldCheck className="h-6 w-6 text-sky-400" />
      </div>

      {/* mini odontograma */}
      <div className="anim-float absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1 rounded-2xl border border-[#22335a] bg-[#0c1322]/90 p-3 backdrop-blur" style={{ animationDelay: "1.2s" }}>
        {[18, 11, 21, 28].map((t) => (
          <span
            key={t}
            className="flex h-7 w-5 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-[9px] font-bold text-sky-300"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-[#131d33]/80 bg-[#05070d]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <ToothLogo boxClassName="h-9 w-9 rounded-lg" />
            <span className="text-base font-bold text-white">
              <span className="text-gradient">Odonto</span>web
            </span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-slate-400 md:flex">
            <a href="#recursos" className="transition hover:text-sky-300">Recursos</a>
            <a href="#planos" className="transition hover:text-sky-300">Planos</a>
            <a href="#sobre" className="transition hover:text-sky-300">Sobre</a>
            <a href="#contato" className="transition hover:text-sky-300">Contato</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Entrar
            </Link>
            <Link
              href="/contato"
              className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/20"
            >
              Fale conosco
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-glow relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-20">
          <div className="anim-fade-up">
            <Badge tone="primary" className="mb-5">
              <Sparkles className="h-3.5 w-3.5" /> Tecnologia + Odontologia + IA + Segurança
            </Badge>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Gestão odontológica <span className="text-gradient">profissional</span> do prontuário ao financeiro
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              A plataforma completa para cirurgiões-dentistas e clínicas: pacientes, anamnese,
              odontograma, radiografias, fotografia clínica, assistente de IA, produção pessoal,
              financeiro e relatórios profissionais em PDF.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#recursos"
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-semibold text-white shadow-[0_6px_30px_-6px_rgba(14,165,233,0.6)] transition hover:bg-sky-400"
              >
                Conheça a plataforma
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#23345a] bg-[#0a1120] px-6 text-sm font-semibold text-slate-200 transition hover:border-sky-600/60 hover:text-sky-300"
              >
                Entrar
              </Link>
              <Link
                href="/contato"
                className="inline-flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-medium text-slate-400 transition hover:text-sky-300"
              >
                Fale conosco <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { v: "12+", l: "Módulos integrados" },
                { v: "100%", l: "Dados isolados por cliente" },
                { v: "24/7", l: "Prontuário disponível" },
              ].map((s) => (
                <div key={s.l} className="rounded-2xl border border-[#16213a] bg-[#0a1120]/70 p-4 text-center">
                  <p className="text-xl font-bold text-gradient">{s.v}</p>
                  <p className="mt-1 text-[11px] leading-tight text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="anim-fade-up" style={{ animationDelay: "0.15s" }}>
            <ToothHero />
          </div>
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="info" className="mb-4">Recursos</Badge>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Tudo o que sua clínica precisa, <span className="text-gradient">em um só lugar</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Do cadastro do paciente ao relatório final — cada etapa do atendimento odontológico
              organizada, segura e com inteligência artificial de apoio.
            </p>
          </div>

          <div className="stagger mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-[#16213a] bg-gradient-to-b from-[#0e1626] to-[#0a1120] p-6 transition-all hover:-translate-y-1 hover:border-sky-600/50 hover:shadow-[0_10px_40px_-10px_rgba(14,165,233,0.25)]"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400 transition group-hover:bg-sky-500/20">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section id="sobre" className="relative py-20">
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <Badge tone="success" className="mb-4">
              <Cpu className="h-3.5 w-3.5" /> Inteligência Odontológica
            </Badge>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              O assistente de IA que <span className="text-gradient">organiza seu raciocínio clínico</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              O Assistente IA resume anamnese, destaca alergias e medicamentos, organiza hipóteses
              para avaliação e alerta sobre possíveis interações ou contraindicações — sempre como
              apoio à decisão do cirurgião-dentista, sem prescrever automaticamente.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "Resumo inteligente do prontuário",
                "Alerta visual de alergias e interações",
                "Sugestões de perguntas para anamnese",
                "Apoio na organização do plano de tratamento",
              ].map((li) => (
                <li key={li} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                  {li}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="anim-float absolute -inset-4 rounded-3xl bg-gradient-to-br from-sky-500/10 to-indigo-500/10 blur-2xl" />
            <div className="relative space-y-4 rounded-3xl border border-[#1c2942] bg-[#0a1120]/90 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Assistente IA</p>
                  <p className="text-[11px] text-slate-500">Apoio à decisão clínica</p>
                </div>
              </div>
              <div className="rounded-2xl border border-[#1c2942] bg-[#070b14] p-4 text-[13px] leading-relaxed text-slate-300">
                <p className="text-slate-500">Paciente: Maria S. • Alergia a penicilinas</p>
                <p className="mt-2">
                  <span className="text-sky-400">Você:</span> Paciente possui alergia a amoxicilina e necessita
                  de profilaxia antibiótica. Existe alternativa?
                </p>
                <div className="mt-3 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.07] p-3.5">
                  <p className="text-slate-200">
                    Considerando a alergia registrada e o histórico do paciente, alternativas como{" "}
                    <span className="font-semibold text-cyan-300">clindamicina</span> ou{" "}
                    <span className="font-semibold text-cyan-300">azitromicina</span> podem ser avaliadas.
                    Verifique diretrizes vigentes e confirme com o cirurgião-dentista responsável antes de
                    qualquer prescrição. Esta é apenas uma sugestão de apoio clínico.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                A IA nunca prescreve automaticamente — apenas apoia o profissional.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="violet" className="mb-4">Planos</Badge>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Escolha o plano ideal para sua <span className="text-gradient">clínica</span>
            </h2>
            <p className="mt-4 text-sm text-slate-400">Planos flexíveis, sem fidelidade, com upgrade a qualquer momento.</p>
          </div>

          <div className="stagger mt-14 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={
                  plan.highlight
                    ? "relative rounded-3xl border border-sky-500/50 bg-gradient-to-b from-[#0d1a30] to-[#0a1120] p-7 shadow-glow"
                    : "relative rounded-3xl border border-[#1c2942] bg-[#0a1120] p-7"
                }
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-1 text-[11px] font-bold text-white shadow-glow">
                    MAIS POPULAR
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-500">{plan.desc}</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-slate-500">{plan.period}</span>
                </div>
                <ul className="mt-7 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-0.5 flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
                        <ChevronRight className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contato"
                  className={
                    plan.highlight
                      ? "mt-8 flex h-11 items-center justify-center rounded-xl bg-sky-500 text-sm font-semibold text-white transition hover:bg-sky-400"
                      : "mt-8 flex h-11 items-center justify-center rounded-xl border border-[#23345a] text-sm font-semibold text-slate-200 transition hover:border-sky-600/60 hover:text-sky-300"
                  }
                >
                  Contratar plano
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="relative py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge tone="primary" className="mb-4">
            <MessageCircle className="h-3.5 w-3.5" /> Contato
          </Badge>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Pronto para <span className="text-gradient">modernizar</span> sua clínica?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Fale com nossa equipe comercial pelo WhatsApp e descubra como a Odontoweb pode
            transformar a gestão do seu consultório.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://wa.me/5500000000000?text=Ol%C3%A1!%20Quero%20conhecer%20a%20Odontoweb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp comercial
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#23345a] bg-[#0a1120] px-6 text-sm font-semibold text-slate-200 transition hover:border-pink-500/50 hover:text-pink-300"
            >
              <InstagramIcon className="h-4 w-4" /> Siga-nos no Instagram
            </a>
            <a
              href="mailto:contato@odontoweb.com.br"
              className="inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-medium text-slate-400 transition hover:text-sky-300"
            >
              <FileText className="h-4 w-4" /> contato@odontoweb.com.br
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#131d33] py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <ToothLogo boxClassName="h-8 w-8 rounded-lg" />
            <span className="text-sm font-bold text-white">
              <span className="text-gradient">Odonto</span>web
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <a href="/privacidade" className="transition hover:text-sky-300">Política de privacidade</a>
            <a href="/termos" className="transition hover:text-sky-300">Termos de uso</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-pink-300">
              <InstagramIcon className="h-3.5 w-3.5" /> Instagram
            </a>
            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition hover:text-emerald-300">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>

          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Odontoweb — Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  )
}
