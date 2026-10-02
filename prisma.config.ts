import { defineConfig } from "prisma/config"
import { config as loadEnv } from "dotenv"

loadEnv()

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: "file:./dev.db",
  },
})