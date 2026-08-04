import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { NewAppointmentForm } from "./new-appointment-form"

export default async function NewAppointmentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireSession()
  if (!hasModule(ctx, "appointments")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")

  const sp = await searchParams
  const patientId = sp.patientId
  const anamnese = sp.anamnese === "1"

  const patients = await prisma.patient.findMany({
    where: { clinicId: ctx.clinicId, active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, phone: true },
    take: 300,
  })

  return <NewAppointmentForm patients={patients} initialPatientId={patientId} initialMode={anamnese ? "anamnese" : "evolucao"} />
}