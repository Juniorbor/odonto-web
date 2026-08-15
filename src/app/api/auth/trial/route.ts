import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { sendWhatsAppText, normalizePhone } from "@/lib/whatsapp"
import { logAction } from "@/lib/audit"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(190),
  email: z.string().email().max(190),
  whatsapp: z.string().min(10).max(30),
})

const TRIAL_DAYS = 7

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let out = ""
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Preencha nome, e-mail e WhatsApp válidos." }, { status: 400 })
    }
    const { name, email, whatsapp } = parsed.data

    const phone = normalizePhone(whatsapp)
    if (!phone) {
      return NextResponse.json({ error: "Número de WhatsApp inválido. Use o formato com DDD (ex: 69 9 9999-9999)." }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail. Fale com nossa equipe comercial." }, { status: 409 })
    }

    const plan = await prisma.plan.findFirst({ where: { isGlobal: true, name: "Profissional" } })

    const password = generatePassword()
    const passwordHash = await hashPassword(password)

    const tenant = await prisma.tenant.create({
      data: {
        name: `${name} (Trial)`,
        status: "TRIAL",
        planName: plan?.name,
        clinics: {
          create: { name, responsible: name, whatsapp: phone },
        },
        subscriptions: {
          create: {
            planId: plan?.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000),
            status: "TRIAL",
            userLimit: plan?.userLimit ?? 1,
            storageLimitBytes: plan?.storageLimitBytes ?? BigInt(1073741824),
            modules: plan?.modules ?? [],
          },
        },
        productionCategories: {
          createMany: {
            data: [
              { name: "Tomografia / Tomos", type: "TOMO" },
              { name: "Traçados", type: "TRACADO" },
              { name: "Outros serviços", type: "OUTRO" },
              { name: "Ariquemes", type: "FERNANDO" },
              { name: "Porto Velho", type: "FERNANDO" },
              { name: "Machadinho", type: "FERNANDO" },
              { name: "Cacoal", type: "FERNANDO" },
              { name: "Rolim de Moura", type: "BERNARDO" },
              { name: "Jí-Paraná", type: "BERNARDO" },
              { name: "Ouro Preto", type: "BERNARDO" },
            ],
          },
        },
        financialCategories: {
          createMany: {
            data: [
              { name: "Salário", type: "ENTRADA" },
              { name: "Primeira quinzena", type: "ENTRADA" },
              { name: "Prestação de serviço", type: "ENTRADA" },
              { name: "Outros", type: "ENTRADA" },
              { name: "Aluguel", type: "FIXA" },
              { name: "Água", type: "FIXA" },
              { name: "Energia", type: "FIXA" },
              { name: "Faculdade", type: "FIXA" },
              { name: "Internet", type: "FIXA" },
              { name: "Transporte", type: "FIXA" },
              { name: "Contador", type: "FIXA" },
              { name: "Família", type: "FIXA" },
              { name: "Mercado", type: "VARIAVEL" },
              { name: "Lazer", type: "VARIAVEL" },
              { name: "Saúde", type: "VARIAVEL" },
              { name: "Outros", type: "VARIAVEL" },
            ],
          },
        },
      },
    })

    const clinic = await prisma.clinic.findUnique({ where: { tenantId: tenant.id } })

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "CLINIC_ADMIN",
        clinicId: clinic?.id,
        phone,
      },
    })

    await logAction({
      userId: user.id,
      tenantId: tenant.id,
      clinicId: clinic?.id,
      action: "trial_created",
      entityType: "Tenant",
      entityId: tenant.id,
      details: { name, plan: plan?.name, days: TRIAL_DAYS } as never,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: req.headers.get("user-agent"),
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("host") ?? "localhost:3000"}`
    const endDate = new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000)
    const message = [
      `Olá ${name}, bem-vindo(a) à plataforma OdontoWeb!`,
      ``,
      `Seu acesso de teste por ${TRIAL_DAYS} dias foi criado com sucesso.`,
      ``,
      `Acesse: ${baseUrl}`,
      `E-mail: ${email.toLowerCase()}`,
      `Senha: ${password}`,
      ``,
      `Seu teste é válido até ${endDate.toLocaleDateString("pt-BR")}.`,
      ``,
      `Qualquer dúvida, fale com a nossa equipe comercial.`,
    ].join("\n")

    const sent = await sendWhatsAppText(phone, message)

    return NextResponse.json({
      ok: true,
      whatsappSent: sent,
      message: sent
        ? "Acesso criado! Verifique o WhatsApp com seus dados de login."
        : "Acesso criado! Não foi possível enviar o WhatsApp — anote os dados abaixo.",
      credentials: sent ? undefined : { email: email.toLowerCase(), password },
    })
  } catch (e) {
    console.error("Trial error:", e)
    return NextResponse.json({ error: "Erro ao criar o acesso de teste." }, { status: 500 })
  }
}
