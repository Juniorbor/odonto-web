import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FinancePage } from "./finance-page"

export default async function FinanceiroIndex() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "finance")) redirect("/app")
  if (!ctx.tenantId) redirect("/app")

  const cats = await prisma.financialCategory.findMany({
    where: { tenantId: ctx.tenantId, active: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })

  return <FinancePage categories={cats} />
}