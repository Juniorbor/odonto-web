import { NextRequest, NextResponse } from "next/server"
import { requireSession, hasModule } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const promptSchema = z.object({
  message: z.string().min(1).max(4000),
  patientId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await requireSession()
  if (!ctx.tenantId) return NextResponse.json({ error: "Sem tenant." }, { status: 400 })
  if (!hasModule(ctx, "ai")) return NextResponse.json({ error: "Módulo IA não disponível no seu plano." }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = promptSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 })
  }
  const { message, patientId } = parsed.data

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: true,
      response:
        "O assistente IA ainda não foi configurado nesta instalação (OPENAI_API_KEY ausente). Assim que o administrador configurar a chave, poderei ajudar com resumos de evoluções, sugestões de diagnóstico e orientações ao paciente.",
      simulated: true,
    })
  }

  let patientContext = ""
  if (patientId && ctx.clinicId) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: ctx.clinicId },
      select: {
        fullName: true,
        sex: true,
        birthDate: true,
        medicalHistories: { orderBy: { version: "desc" }, take: 1 },
        clinicalRecords: { orderBy: { occurredAt: "desc" }, take: 5 },
      },
    })
    if (patient) {
      const records = patient.clinicalRecords
        .map((r) => `- [${r.occurredAt.toISOString().slice(0, 10)}] Queixa: ${r.chiefComplaint ?? "—"} | Exame: ${r.examFindings ?? "—"} | Diagnóstico: ${r.diagnoses ?? "—"} | Procedimento: ${r.procedures ?? "—"}`)
        .join("\n")
      const mh = patient.medicalHistories[0]
      patientContext = [
        `Paciente: ${patient.fullName}`,
        patient.sex ? `Sexo: ${patient.sex}` : "",
        patient.birthDate ? `Nascimento: ${patient.birthDate.toISOString().slice(0, 10)}` : "",
        mh
          ? `Anamnese v${mh.version}: doenças=${mh.hasDisease ? "sim" : "não"} (${mh.diseaseDescription ?? ""}), tratamento médico=${mh.underMedicalTreatment ? "sim" : "não"}, alergias medicamentosas=${mh.hasMedicationAllergy ? "sim" : "não"}, tabagismo=${mh.smoking ? "sim" : "não"}`
          : "Sem anamnese",
        records ? `Evoluções recentes:\n${records}` : "Sem evoluções",
      ]
        .filter(Boolean)
        .join("\n")
    }
  }

  const systemPrompt = [
    "Você é o assistente clínico da Odontoweb, uma plataforma odontológica brasileira.",
    "Responda em português do Brasil, de forma técnica e objetiva, adequada para dentistas.",
    "Não invente informações clínicas do paciente que não estejam no contexto fornecido.",
    "Deixe claro quando uma resposta exigir avaliação presencial do profissional.",
    patientContext ? `\nContexto do paciente:\n${patientContext}` : "",
  ].join("\n")

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(data?.error?.message || `OpenAI error ${response.status}`)
    }

    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error("Resposta vazia da OpenAI.")

    await prisma.aiInteraction.create({
      data: {
        tenantId: ctx.tenantId,
        clinicId: ctx.clinicId,
        userId: ctx.user.id,
        patientId: patientId,
        promptType: "assistant",
        prompt: message,
        response: text,
        model,
      },
    })

    return NextResponse.json({ ok: true, response: text })
  } catch (e) {
    console.error("AI error:", e)
    return NextResponse.json({ error: "Falha ao consultar o assistente. Tente novamente." }, { status: 500 })
  }
}