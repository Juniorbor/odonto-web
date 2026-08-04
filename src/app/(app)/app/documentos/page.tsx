import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DocumentsPage } from "./documents-page"

export default async function DocumentosIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "documents")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")

  const patients = await prisma.patient.findMany({
    where: { clinicId: ctx.clinicId, active: true },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true },
    take: 300,
  })

  return <DocumentsPage patients={patients} />
}
