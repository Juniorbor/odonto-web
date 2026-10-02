import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "eliz-decora-festas-commercial-secret-key-2026"
)

export type UserRole = "ADMIN" | "GERENTE" | "FUNCIONARIO" | "VENDEDOR"

export interface SessionPayload {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string | null
  title?: string | null
  permissions: string[]
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

export function generateResetToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function hashResetToken(token: string): string {
  return bcrypt.hashSync(token, 8)
}

export async function createJwtToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET)
}

export async function verifyJwtToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("eliz_decora_session")?.value
    if (!token) return null

    const verified = await verifyJwtToken(token)
    if (!verified) return null

    // Check if user still exists and is active
    const dbUser = await prisma.user.findUnique({
      where: { id: verified.id },
      select: { id: true, name: true, email: true, role: true, permissions: true, active: true, avatarUrl: true, title: true },
    })

    if (!dbUser || !dbUser.active) return null

    let parsedPermissions: string[] = []
    if (dbUser.permissions) {
      try {
        parsedPermissions = JSON.parse(dbUser.permissions)
      } catch {
        parsedPermissions = []
      }
    }

    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as UserRole,
      avatarUrl: dbUser.avatarUrl,
      title: dbUser.title,
      permissions: parsedPermissions,
    }
  } catch {
    return null
  }
}

export async function hasPermission(user: SessionPayload | null, permissionCode: string): Promise<boolean> {
  if (!user) return false
  if (user.role === "ADMIN" || user.permissions.includes("ALL")) return true
  return user.permissions.includes(permissionCode)
}

export async function logAudit(userId: string | null, userName: string, action: string, details?: string, device?: string, ip?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        action,
        details,
        device: device || "Navegador Web",
        ip: ip || "127.0.0.1",
      },
    })
  } catch (err) {
    console.error("Audit log error:", err)
  }
}