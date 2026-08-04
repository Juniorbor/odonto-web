import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ImagesPage } from "./images-page"

export default async function FotografiasIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "images")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")

  const patients = await prisma.patient.findMany({
    where: { clinicId: ctx.clinicId, active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
    take: 300,
  })

  return <ImagesPage patients={patients} />
}