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
    console.error("AI: OPENAI_API_KEY ausente")
    return NextResponse.json({ error: "Assistente IA não configurado. Defina OPENAI_API_KEY no servidor." }, { status: 503 })
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
    "Você é o Assistente IA da Odontoweb, um cirurgião-dentista especialista e professor universitário em Odontologia.",
    "Atue com a precisão de um especialista: seja direto, objetivo e sem rodeios. Vá direto ao ponto da pergunta.",
    "Responda em português do Brasil, com linguagem técnica e adequada para profissionais de Odontologia.",
    "Quando aplicável, estruture a resposta em tópicos curtos (diagnóstico, conduta, orientação, referência) sem texto supérfluo.",
    "Nunca invente informações clínicas do paciente ausentes no contexto fornecido.",
    "Deixe explícito que a avaliação final exige exame clínico e o juízo profissional do dentista responsável.",
    "Não forneça recomendações medicinais fora do escopo odontológico. Em emergências, oriente a busca imediata de atendimento.",
    patientContext ? `\nContexto do paciente:\n${patientContext}` : "",
  ].join("\n")

  try {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
    const response = await fetch(`${baseUrl}/chat/completions`, {
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
      const msg = data?.error?.message || `OpenAI error ${response.status}`
      if (response.status === 429 || response.status === 401) {
        return NextResponse.json({ error: `Assistente indisponível: ${msg}` }, { status: 503 })
      }
      throw new Error(msg)
    }

    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error("Resposta vazia da IA.")

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