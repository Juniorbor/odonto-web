import Link from "next/link"
import { requireSession } from "@/lib/auth"
import { Building2, CreditCard, FileLock2, KeyRound, Settings, ShieldCheck, UserCircle2 } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"

export default async function ConfigIndex() {
  const ctx = await requireSession()

  const items = [
    {
      href: "/app/configuracoes/perfil",
      icon: <UserCircle2 className="h-5 w-5" />,
      title: "Perfil",
      desc: "Seus dados, título profissional e senha.",
      tone: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    },
    {
      href: "/app/configuracoes/clinica",
      icon: <Building2 className="h-5 w-5" />,
      title: "Clínica",
      desc: "Dados da clínica, endereço e cabeçalho de relatórios.",
      tone: "text-violet-400 bg-violet-500/10 border-violet-500/25",
    },
    {
      href: "/app/configuracoes/usuarios",
      icon: <KeyRound className="h-5 w-5" />,
      title: "Usuários",
      desc: "Equipe, perfis de acesso e limites do plano.",
      tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      href: "/app/configuracoes/assinatura",
      icon: <CreditCard className="h-5 w-5" />,
      title: "Assinatura",
      desc: "Plano contratado, vencimento e uso de armazenamento.",
      tone: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
    {
      href: "/app/configuracoes/seguranca",
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Segurança",
      desc: "Senha, sessões ativas e boas práticas.",
      tone: "text-rose-400 bg-rose-500/10 border-rose-500/25",
    },
    {
      href: "/app/configuracoes/lgpd",
      icon: <FileLock2 className="h-5 w-5" />,
      title: "LGPD & Privacidade",
      desc: "Consentimentos, política de privacidade e seus direitos.",
      tone: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",
    },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">
          Configurações <span className="text-gradient">da conta</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie suas preferências e detalhes da clínica.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="group transition hover:-translate-y-0.5">
            <Card>
              <CardBody>
                <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${item.tone}`}>
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-sky-300">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.desc}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}