import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { comparePassword, createJwtToken, logAudit } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, rememberMe } = body

    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: "Credenciais inválidas ou usuário inativo." }, { status: 401 })
    }

    const isValid = await comparePassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 })
    }

    let parsedPermissions: string[] = []
    if (user.permissions) {
      try {
        parsedPermissions = JSON.parse(user.permissions)
      } catch {
        parsedPermissions = []
      }
    }

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      avatarUrl: user.avatarUrl,
      title: user.title,
      permissions: parsedPermissions,
    }

    const token = await createJwtToken(sessionPayload)

    // Save session in DB
    const userAgent = request.headers.get("user-agent") || "Web"
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1"

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        ip,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    // Update last login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastDevice: userAgent,
      },
    })

    // Log Audit
    await logAudit(user.id, user.name, "LOGIN_SUCCESS", "Usuário realizou login com sucesso", userAgent, ip)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("eliz_decora_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: "/",
    })

    return NextResponse.json({
      success: true,
      user: sessionPayload,
    })
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno no servidor ao realizar login." }, { status: 500 })
  }
}