import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { RadiographsPage } from "./radiographs-page"

export default async function RadiografiasIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "radiographs")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")

  const patients = await prisma.patient.findMany({
    where: { clinicId: ctx.clinicId, active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
    take: 300,
  })

  return <RadiographsPage patients={patients} />
}
