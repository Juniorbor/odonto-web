import { notFound } from "next/navigation"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PatientDetail } from "./patient-detail"

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireSession()
  if (!ctx.clinicId || !hasModule(ctx, "patients")) notFound()
  const { id } = await params

  const patient = await prisma.patient.findFirst({
    where: { id, clinicId: ctx.clinicId },
    include: {
      medicalHistories: { orderBy: { createdAt: "desc" }, take: 3 },
      appointments: {
        orderBy: { startsAt: "desc" },
        take: 10,
        select: {
          id: true,
          startsAt: true,
          status: true,
          type: true,
          user: { select: { name: true } },
        },
      },
      clinicalRecords: {
        orderBy: { occurredAt: "desc" },
        take: 10,
        select: {
          id: true,
          occurredAt: true,
          chiefComplaint: true,
          observations: true,
          user: { select: { name: true } },
        },
      },
      documents: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, title: true, type: true, createdAt: true } },
      radiographs: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, label: true, takenAt: true, mimeType: true } },
      patientImages: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, category: true, label: true, takenAt: true } },
      _count: {
        select: { appointments: true, clinicalRecords: true, documents: true, radiographs: true, odontograms: true, patientImages: true },
      },
    },
  })
  if (!patient) notFound()

  const { birthDate, createdAt, updatedAt, medicalHistories, appointments, clinicalRecords, documents, radiographs, patientImages, ...rest } = patient

  return (
    <PatientDetail
      patient={{
        ...rest,
        birthDate: birthDate?.toISOString() ?? null,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        _count: patient._count,
      }}
      medicalHistories={medicalHistories.map((h) => ({
        id: h.id,
        version: h.version,
        signedAt: h.signedAt?.toISOString() ?? null,
        createdAt: h.createdAt.toISOString(),
        hasDisease: h.hasDisease,
        diseaseDescription: h.diseaseDescription,
        underMedicalTreatment: h.underMedicalTreatment,
      }))}
      appointments={appointments.map((a) => ({ ...a, startsAt: a.startsAt.toISOString() }))}
      clinicalRecords={clinicalRecords.map((c) => ({
        id: c.id,
        createdAt: c.occurredAt.toISOString(),
        chiefComplaint: c.chiefComplaint,
        observations: c.observations,
        user: c.user,
      }))}
      documents={documents.map((d) => ({ id: d.id, title: d.title, type: d.type, createdAt: d.createdAt.toISOString() }))}
      radiographs={radiographs.map((r) => ({ id: r.id, label: r.label, takenAt: r.takenAt.toISOString(), mimeType: r.mimeType }))}
      patientImages={patientImages.map((i) => ({
        id: i.id,
        category: i.category,
        label: i.label,
        takenAt: i.takenAt.toISOString(),
      }))}
      canEdit={true}
      modules={["appointments", "odontogram", "radiographs", "images", "ai"].filter((m) => hasModule(ctx, m))}
    />
  )
}