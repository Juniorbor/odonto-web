import { requireSession, hasModule } from "@/lib/auth"
import { redirect } from "next/navigation"
import { PatientForm } from "./patient-form"

export default async function NewPatientPage() {
  const ctx = await requireSession()
  if (!hasModule(ctx, "patients")) redirect("/app")
  if (!ctx.clinicId) redirect("/app")
  return <PatientForm />
}