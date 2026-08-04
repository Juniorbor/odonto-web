import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AgendaPage } from "./agenda-page"

export default async function AgendaIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "agenda") && !hasModule(ctx, "appointments")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")

  const [patients, professionals] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId: ctx.clinicId, active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, phone: true },
      take: 200,
    }),
    prisma.professional.findMany({
      where: { clinicId: ctx.clinicId },
      select: { id: true, fullName: true, cro: true, specialty: true },
    }),
  ])

  return <AgendaPage patients={patients} professionals={professionals} />
}