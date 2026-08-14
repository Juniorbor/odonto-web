import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

const SESSION_COOKIE = "odc_session"
const IMPERSONATION_COOKIE = "odc_impersonate"
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret")

type TokenPayload = { userId: string }

export type SessionContext = {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    avatarUrl: string | null
  }
  tenantId: string | null
  clinicId: string | null
  modules: string[]
  isAdminMaster: boolean
  impersonating: boolean
}

export async function signSession(payload: TokenPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return (payload as unknown as TokenPayload) ?? null
  } catch {
    return null
  }
}

export async function createSessionToken(userId: string) {
  return signSession({ userId })
}

/** Determina se a conexão atual é HTTPS (direta ou via proxy/edge com x-forwarded-proto). */
export function requestIsSecure(req: Request) {
  const forwarded = req.headers.get("x-forwarded-proto")
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https"
  return req.url.startsWith("https://")
}

export async function setSessionCookie(token: string, opts: { secure: boolean; maxAge?: number }) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: "lax",
    path: "/",
    maxAge: opts.maxAge ?? 60 * 60 * 24 * 7,
  })
}

export async function destroySessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionToken() {
  const store = await cookies()
  return store.get(SESSION_COOKIE)?.value ?? null
}

export async function setImpersonationCookie(clinicId: string, opts: { secure: boolean }) {
  const store = await cookies()
  store.set(IMPERSONATION_COOKIE, clinicId, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
}

export async function clearImpersonationCookie() {
  const store = await cookies()
  store.delete(IMPERSONATION_COOKIE)
}

async function getImpersonationContext(user: {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl: string | null
}): Promise<SessionContext | null> {
  const store = await cookies()
  const clinicId = store.get(IMPERSONATION_COOKIE)?.value ?? null
  if (!clinicId) return null

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      tenantId: true,
      tenant: { select: { status: true } },
    },
  })
  if (!clinic || (clinic.tenant.status !== "ACTIVE" && clinic.tenant.status !== "TRIAL")) {
    store.delete(IMPERSONATION_COOKIE)
    return null
  }

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: clinic.tenantId, status: { in: ["ACTIVE", "TRIAL"] } },
    orderBy: { createdAt: "desc" },
    select: { modules: true },
  })

  return {
    user,
    tenantId: clinic.tenantId,
    clinicId,
    modules: subscription?.modules ?? [],
    isAdminMaster: true,
    impersonating: true,
  }
}

/** Carrega o usuário e seu contexto de tenant a partir do cookie de sessão. Retorna null se não autenticado ou suspenso. */
async function loadSessionContext(userId: string): Promise<SessionContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      avatarUrl: true,
      clinicId: true,
    },
  })
  if (!user || !user.active) return null

  if (user.role === "ADMIN_MASTER") {
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    }
    const impersonation = await getImpersonationContext(userInfo)
    if (impersonation) return impersonation
    return {
      user: userInfo,
      tenantId: null,
      clinicId: null,
      modules: ALL_MODULES,
      isAdminMaster: true,
      impersonating: false,
    }
  }

  if (!user.clinicId) return null
  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
    select: { tenantId: true, tenant: { select: { id: true, status: true } } },
  })
  if (!clinic) return null
  if (clinic.tenant.status !== "ACTIVE" && clinic.tenant.status !== "TRIAL") return null

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: clinic.tenantId, status: { in: ["ACTIVE", "TRIAL"] } },
    orderBy: { createdAt: "desc" },
    select: { modules: true },
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    tenantId: clinic.tenantId,
    clinicId: user.clinicId,
    modules: subscription?.modules ?? [],
    isAdminMaster: false,
    impersonating: false,
  }
}

// Cache em memória do contexto de sessão: evita 3 consultas ao banco por requisição.
// O token JWT já garante a identidade; o cache apenas reflete mudanças de permissões com atraso de 60s.
const SESSION_CACHE_TTL_MS = 60_000
const sessionCache = new Map<string, { ctx: SessionContext; expiresAt: number }>()

export function clearSessionCache(userId: string) {
  sessionCache.delete(userId)
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const token = await getSessionToken()
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload?.userId) return null

  const cached = sessionCache.get(payload.userId)
  if (cached && cached.expiresAt > Date.now()) return cached.ctx

  const ctx = await loadSessionContext(payload.userId)
  if (ctx) {
    sessionCache.set(payload.userId, { ctx, expiresAt: Date.now() + SESSION_CACHE_TTL_MS })
  } else {
    sessionCache.delete(payload.userId)
  }
  return ctx
}

export const ALL_MODULES = [
  "patients",
  "anamnesis",
  "appointments",
  "agenda",
  "odontogram",
  "images",
  "radiographs",
  "documents",
  "production",
  "finance",
  "reports",
  "ai",
  "settings",
]

/** Redireciona para login se não autenticado. */
export async function requireSession(): Promise<SessionContext> {
  const ctx = await getSessionContext()
  if (!ctx) redirect("/login")
  return ctx
}

export function hasModule(ctx: SessionContext | null, module: string): boolean {
  if (!ctx) return false
  if (ctx.isAdminMaster) return true
  return ctx.modules.includes(module)
}

export async function requireModule(module: string): Promise<SessionContext> {
  const ctx = await requireSession()
  if (!hasModule(ctx, module)) redirect("/app")
  return ctx
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function hashResetToken(token: string) {
  return hashToken(token)
}