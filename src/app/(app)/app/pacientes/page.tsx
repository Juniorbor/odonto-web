import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PatientsPage } from "./patients-page"

const PAGE_SIZE = 20

export default async function PatientsIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "patients")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where: { clinicId: ctx.clinicId } }),
    prisma.patient.findMany({
      where: { clinicId: ctx.clinicId },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        photoUrl: true,
        fullName: true,
        socialName: true,
        cpf: true,
        birthDate: true,
        sex: true,
        phone: true,
        whatsapp: true,
        email: true,
        active: true,
        createdAt: true,
        _count: { select: { appointments: true, clinicalRecords: true } },
      },
    }),
  ])

  return (
    <PatientsPage
      initialPatients={patients.map((p) => ({
        ...p,
        birthDate: p.birthDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      }))}
      initialTotal={total}
      pageSize={PAGE_SIZE}
    />
  )
}