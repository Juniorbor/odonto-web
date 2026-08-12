import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ClipboardList } from "lucide-react"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { initials } from "@/lib/utils"
import { PatientAnamnesis } from "./anamnese-form"

export default async function PatientAnamnesisPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId || !hasModule(ctx, "patients")) notFound()
  const { id } = await params

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: ctx.clinicId },
    select: { id: true, fullName: true, birthDate: true },
  })
  if (!patient) notFound()

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <Link
          href={`/app/pacientes/${patient.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-sky-300"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 font-bold text-white">
            {initials(patient.fullName)}
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <ClipboardList className="h-5 w-5 text-sky-400" /> Anamnese
            </h1>
            <p className="text-sm text-slate-500">
              {patient.fullName}
              {patient.birthDate ? ` · nasc. ${patient.birthDate.toLocaleDateString("pt-BR")}` : ""}
            </p>
          </div>
        </div>
      </div>

      <PatientAnamnesis patientId={patient.id} patientName={patient.fullName} />
    </div>
  )
}
