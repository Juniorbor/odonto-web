import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, FileLock2, CheckCircle2, ShieldCheck } from "lucide-react"
import { Card, CardBody, CardHeader, Badge } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

export default async function ConfigLgpdPage() {
  const ctx = await requireSession()
  if (!ctx.clinicId) {
    return <p className="p-8 text-center text-sm text-slate-500">Sem clínica vinculada.</p>
  }

  const [terms, consentGroup] = await Promise.all([
    prisma.setting.findFirst({ where: { key: "termsOfUse" } }),
    prisma.consent.groupBy({ by: ["type"], where: { patient: { clinicId: ctx.clinicId } }, _count: { _all: true } }),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up">
        <LinkButton href="/app/configuracoes" variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </LinkButton>
        <h1 className="mt-4 text-2xl font-bold text-white">
          LGPD &amp; <span className="text-gradient">Privacidade</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          A Lei Geral de Proteção de Dados (LGPD) governa o tratamento de dados pessoais. A Odontoweb trata os dados como Controladora e sua clínica como Operadora.
        </p>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="O que coletamos e por quê" />
        <CardBody className="space-y-3 text-sm text-slate-400">
          <p>
            <strong className="text-slate-200">Dados cadastrais</strong> (nome, CPF, contato): necessários para identificar o paciente e prestar o atendimento odontológico.
          </p>
          <p>
            <strong className="text-slate-200">Dados de saúde</strong> (anamnese, prontuário, radiografias): essenciais para o exercício profissional e resguardados por sigilo profissional.
          </p>
          <p>
            <strong className="text-slate-200">Uso exclusivo</strong>: seus dados não são vendidos nem compartilhados com terceiros sem consentimento.
          </p>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Consentimentos registrados" subtitle="Termos assinados pelos pacientes de atendimentos." />
        <CardBody>
          {consentGroup.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum consentimento registrado ainda. O sistema solicitará o consentimento antes de registrar dados de saúde.</p>
          ) : (
            <div className="space-y-2">
              {consentGroup.map((c) => (
                <div key={c.type} className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="h-4 w-4 text-sky-400" />
                    <span className="text-sm font-medium text-slate-200">{c.type.replace("_", " ").toLowerCase()}</span>
                  </div>
                  <Badge tone="success">{c._count._all} registros</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Seus direitos" />
        <CardBody className="space-y-2 text-sm text-slate-400">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Solicitar cópia ou exclusão de dados a qualquer momento.
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Revogar consentimentos previamente dados.
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Correção de dados incompletos ou desatualizados.
          </p>
          <p className="mt-3 text-xs text-slate-600">
            Para exercer os direitos, fale com a clínica ou com{" "}
            <a href="mailto:contato@odontoweb.com.br" className="text-sky-400 hover:text-sky-300">contato@odontoweb.com.br</a>
          </p>
        </CardBody>
      </Card>

      {terms?.value && (
        <Card className="anim-fade-up">
          <CardHeader title="Termos de uso" />
          <CardBody>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-500">{String(terms.value)}</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}