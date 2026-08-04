import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { OdontogramPage } from "./odontogram-page"

export default async function OdontogramaIndex({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ctx = await requireSession()
  if (!hasModule(ctx, "odontogram")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")

  const sp = await searchParams
  const patientId = sp.patientId

  const patients = await prisma.patient.findMany({
    where: { clinicId: ctx.clinicId, active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
    take: 300,
  })

  return <OdontogramPage patients={patients} initialPatientId={patientId} />
}