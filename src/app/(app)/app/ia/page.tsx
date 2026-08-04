import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AiPage } from "./ai-page"

export default async function AiIndex({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>
}) {
  const ctx = await requireSession()
  if (!hasModule(ctx, "ai")) redirect("/app")
  const { patientId } = await searchParams

  const patients = await prisma.patient.findMany({
    where: { clinicId: ctx.clinicId ?? "none", active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
    take: 200,
  })

  const preselected =
    patientId && patients.some((p) => p.id === patientId) ? patientId : undefined

  return <AiPage patients={patients} defaultPatientId={preselected} />
}