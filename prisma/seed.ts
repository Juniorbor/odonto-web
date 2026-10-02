import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import bcrypt from "bcryptjs"

const adapter = new PrismaLibSql({ url: "file:dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding Eliz Decora Festas clean database...")

  // Password for initial admin user: "123456"
  const passwordHash = await bcrypt.hash("123456", 10)

  // 1. Initial Master Admin User
  await prisma.user.upsert({
    where: { email: "admin@elizdecorafestas.com.br" },
    update: {},
    create: {
      name: "Administrador Master",
      email: "admin@elizdecorafestas.com.br",
      passwordHash,
      role: "ADMIN",
      title: "Administrador Geral",
      phone: "(11) 98888-7777",
      permissions: JSON.stringify(["ALL"]),
    },
  })

  // 2. Company Settings
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {
      companyName: "Eliz Decora Festas",
      email: "contato@elizdecorafestas.com.br",
    },
    create: {
      id: "default",
      companyName: "Eliz Decora Festas",
      slogan: "Transformando momentos especiais em experiências inesquecíveis.",
      cnpj: "12.345.678/0001-99",
      phone: "(11) 98888-7777",
      whatsapp: "(11) 98888-7777",
      email: "contato@elizdecorafestas.com.br",
      address: "Av. das Festas, 1000 - São Paulo, SP",
      logoUrl: "/logo.jpg",
      primaryColor: "#EC4899",
      secondaryColor: "#0284C7",
      accentColor: "#F59E0B",
      themeMode: "light",
    },
  })

  console.log("Clean seeding finished successfully for Eliz Decora Festas!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
