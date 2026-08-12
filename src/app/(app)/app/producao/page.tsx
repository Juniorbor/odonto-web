import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProductionPage } from "./production-page"

export default async function ProducaoIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "production")) redirect("/app")
  if (!ctx.tenantId) redirect("/app")

  const [patients, cats] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId: ctx.clinicId ?? "none", active: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, city: true },
      take: 500,
    }),
    prisma.productionCategory.findMany({
      where: { tenantId: ctx.tenantId, active: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <ProductionPage
      patients={patients}
      categories={cats.map((c) => ({ ...c, price: c.price?.toString() ?? null }))}
      canManageCategories={ctx.user.role === "CLINIC_ADMIN"}
    />
  )
}