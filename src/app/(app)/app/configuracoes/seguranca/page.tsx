import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, KeyRound, ShieldCheck, LogOut, Smartphone } from "lucide-react"
import { Card, CardBody, CardHeader, Badge } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

export default async function ConfigSecurityPage() {
  const ctx = await requireSession()

  const sessions = await prisma.session.findMany({
    where: { userId: ctx.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up">
        <LinkButton href="/app/configuracoes" variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </LinkButton>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Segurança <span className="text-gradient">da conta</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Revisão de acesso e boas práticas.</p>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="Senha" subtitle="Altere sua senha periodicamente e não a compartilhe." />
        <CardBody>
          <LinkButton href="/app/configuracoes/perfil" variant="outline" size="sm">
            <KeyRound className="h-3.5 w-3.5" /> Trocar senha no perfil
          </LinkButton>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader
          title="Sessões e dispositivos"
          subtitle="Acessos recentes na sua conta. Saia de dispositivos que você não reconhece."
        />
        <CardBody>
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhuma sessão registrada.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1c2942] bg-[#0a1120]">
                      <Smartphone className="h-4 w-4 text-slate-500" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{s.userAgent || "Dispositivo desconhecido"}</p>
                      <p className="text-xs text-slate-500">{s.ip ? `IP ${s.ip} · ` : ""}{formatDate(s.createdAt, true)}</p>
                    </div>
                  </div>
                  <Badge tone={s.expiresAt > new Date() ? "success" : "neutral"}>
                    {s.expiresAt > new Date() ? "Ativa" : "Expirada"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardBody>
          <p className="flex items-start gap-3 text-sm text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            Sua conexão é criptografada, as senhas são armazenadas com hash seguro e o acesso é registrado em trilha de auditoria.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}