import { notFound } from "next/navigation"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PatientForm } from "../../novo/patient-form"

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId || !hasModule(ctx, "patients")) notFound()
  const { id } = await params

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: ctx.clinicId },
    select: {
      id: true,
      fullName: true,
      socialName: true,
      cpf: true,
      rg: true,
      birthDate: true,
      sex: true,
      maritalStatus: true,
      occupation: true,
      phone: true,
      whatsapp: true,
      email: true,
      address: true,
      city: true,
      state: true,
      cep: true,
      guardian: true,
      observations: true,
    },
  })
  if (!patient) notFound()

  return (
    <PatientForm
      patient={{
        ...patient,
        birthDate: patient.birthDate?.toISOString() ?? null,
      }}
    />
  )
}
