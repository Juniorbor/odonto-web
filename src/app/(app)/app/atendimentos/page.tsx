import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { RecordsList } from "./records-list"

export default async function AtendimentosIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "appointments") && !hasModule(ctx, "patients")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")

  const records = await prisma.clinicalRecord.findMany({
    where: { clinicId: ctx.clinicId },
    orderBy: { occurredAt: "desc" },
    take: 50,
    select: {
      id: true,
      occurredAt: true,
      chiefComplaint: true,
      diagnoses: true,
      procedures: true,
      patient: { select: { id: true, fullName: true, phone: true } },
      user: { select: { name: true } },
    },
  })

  return (
    <RecordsList
      records={records.map((r) => ({
        ...r,
        occurredAt: r.occurredAt.toISOString(),
      }))}
    />
  )
}