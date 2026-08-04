import { requireSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ClinicPage } from "./clinic-page"

export default async function ConfigClinicPage() {
  const ctx = await requireSession()
  if (!ctx.clinicId) {
    return <p className="p-8 text-center text-sm text-slate-500">Sem clínica vinculada.</p>
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: ctx.clinicId } })

  return (
    <ClinicPage
      clinic={clinic ? {
        name: clinic.name,
        legalName: clinic.legalName,
        cnpj: clinic.cnpj,
        phone: clinic.phone,
        whatsapp: clinic.whatsapp,
        email: clinic.email,
        address: clinic.address,
        city: clinic.city,
        state: clinic.state,
        cep: clinic.cep,
        responsible: clinic.responsible,
        cro: clinic.cro,
        reportHeader: clinic.reportHeader,
        reportFooter: clinic.reportFooter,
      } : null}
      canEdit={ctx.user.role === "CLINIC_ADMIN"}
    />
  )
}