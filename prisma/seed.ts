import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL! })),
})

async function main() {
  const passwordHash = await bcrypt.hash("Admin@2026", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@odontoweb.com.br" },
    update: {},
    create: {
      name: "Administrador Master",
      email: "admin@odontoweb.com.br",
      passwordHash,
      role: "ADMIN_MASTER",
      title: "Administrador",
    },
  })
  console.log("Admin master:", admin.email, "/ senha: Admin@2026")

  const plans = [
    {
      name: "Básico",
      description: "Pacientes, anamnese e atendimento",
      price: 99,
      modules: ["patients", "anamnesis", "appointments"],
      userLimit: 2,
      storageLimitBytes: BigInt(5) * BigInt(1073741824),
    },
    {
      name: "Profissional",
      description: "Tudo do Básico + odontograma, imagens, radiografias, relatórios e IA",
      price: 199,
      modules: ["patients", "anamnesis", "appointments", "odontogram", "images", "radiographs", "reports", "ai"],
      userLimit: 5,
      storageLimitBytes: BigInt(25) * BigInt(1073741824),
    },
    {
      name: "Premium",
      description: "Todos os módulos, produção, financeiro e IA avançada",
      price: 349,
      modules: [
        "patients",
        "anamnesis",
        "appointments",
        "odontogram",
        "images",
        "radiographs",
        "reports",
        "ai",
        "production",
        "finance",
        "agenda",
        "documents",
      ],
      userLimit: 15,
      storageLimitBytes: BigInt(100) * BigInt(1073741824),
    },
  ]

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name, isGlobal: true } })
    if (!existing) {
      await prisma.plan.create({ data: { ...plan, isGlobal: true, price: plan.price as unknown as any } })
    }
  }

  const settings: Record<string, unknown> = {
    appName: "Odontoweb",
    logoUrl: null,
    faviconUrl: null,
    primaryColor: "#0ea5e9",
    whatsapp: "",
    instagram: "https://instagram.com",
    contactEmail: "contato@odontoweb.com.br",
    commercialInfo: "Sistema de gestão odontológica profissional",
    privacyPolicy: "Sua privacidade é importante...",
    termsOfUse: "Termos de uso...",
  }

  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.setting.findUnique({ where: { key } })
    if (!existing) {
      await prisma.setting.create({ data: { key, value: value as never } })
    }
  }

  console.log("Seed concluído.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
