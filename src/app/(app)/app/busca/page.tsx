import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Search } from "lucide-react"
import Link from "next/link"
import { Card, CardBody } from "@/components/ui/card"
import { formatDate, formatCpf } from "@/lib/utils"
import { EmptyState } from "@/components/ui/feedback"

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await requireSession()
  const sp = await searchParams
  const q = (sp.q || "").trim()

  let patients: { id: string; fullName: string; cpf: string | null; phone: string | null; createdAt: Date }[] = []
  if (q && ctx.clinicId) {
    patients = await prisma.patient.findMany({
      where: {
        clinicId: ctx.clinicId,
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { cpf: { contains: q } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { fullName: "asc" },
      take: 30,
      select: { id: true, fullName: true, cpf: true, phone: true, createdAt: true },
    })
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">
          Busca <span className="text-gradient">global</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {q ? `Resultados para "${q}"` : "Digite o termo na barra superior para pesquisar pacientes."}
        </p>
      </div>

      {q && (
        <div className="anim-fade-up stagger space-y-2.5">
          <h3 className="text-sm font-semibold text-slate-100">Pacientes ({patients.length})</h3>
          {patients.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState icon="search" title="Nenhum paciente encontrado" description="Tente outro termo: nome, CPF, telefone ou e-mail." />
              </CardBody>
            </Card>
          ) : (
            patients.map((p) => (
              <Link key={p.id} href={`/app/pacientes/${p.id}`} className="block transition hover:-translate-y-0.5">
                <Card>
                  <CardBody>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-xs font-bold text-white">
                        {p.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{p.fullName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {p.cpf ? formatCpf(p.cpf) : ""}
                          {p.phone ? ` · ${p.phone}` : ""}
                          {p.createdAt ? ` · cadastro ${formatDate(p.createdAt)}` : ""}
                        </p>
                      </div>
                      <Search className="h-4 w-4 text-slate-600" />
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}