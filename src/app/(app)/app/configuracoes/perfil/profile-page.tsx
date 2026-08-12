"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, KeyRound, Mail, Save, ShieldCheck } from "lucide-react"
import { Card, CardBody, CardHeader } from "@/components/ui/card"
import { Button, LinkButton } from "@/components/ui/button"
import { Field, Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { initials, formatDate } from "@/lib/utils"

const ROLE_LABEL: Record<string, string> = {
  ADMIN_MASTER: "Administrador Master",
  CLINIC_ADMIN: "Administrador da clínica",
  PROFESSIONAL: "Profissional",
  RECEPTION: "Recepcionista",
}

export function ProfilePage({
  user,
}: {
  user: {
    name: string
    email: string
    phone: string | null
    title: string | null
    avatarUrl: string | null
    role: string
    lastLoginAt: string | null
  }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    title: user.title ?? "",
    avatarUrl: user.avatarUrl ?? "",
  })
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" })

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/app/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      toast("Perfil atualizado.", "success")
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (pwd.newPassword !== pwd.confirm) {
      toast("A confirmação da nova senha não confere.", "error")
      return
    }
    if (pwd.newPassword.length < 6) {
      toast("A nova senha deve ter no mínimo 6 caracteres.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/app/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwd.currentPassword, newPassword: pwd.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao trocar senha.")
      toast("Senha alterada com sucesso.", "success")
      setPwd({ currentPassword: "", newPassword: "", confirm: "" })
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <LinkButton href="/app/configuracoes" variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </LinkButton>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Meu <span className="text-gradient">perfil</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Seus dados pessoais e credenciais de acesso.</p>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="Identificação" subtitle="Informações exibidas para sua equipe." />
        <CardBody>
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-xl font-bold text-white">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-100">{user.name}</p>
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              <span className="mt-1 inline-block rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium text-sky-300">
                {ROLE_LABEL[user.role] ?? user.role}
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Título / especialidade">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ortodontista" />
            </Field>
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </Field>
            <Field label="Foto (URL)">
              <Input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." />
            </Field>
          </div>
          <div className="mt-4 flex items-center justify-end">
            <Button onClick={saveProfile} disabled={saving || !form.name.trim()}>
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar perfil"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Trocar senha" subtitle="Recomendamos uma senha única e forte." />
        <CardBody className="space-y-4">
          <Field label="Senha atual" required>
            <Input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nova senha" required>
              <Input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </Field>
            <Field label="Confirmar nova senha" required>
              <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
            </Field>
          </div>
          <div className="flex items-center justify-end">
            <Button
              onClick={changePassword}
              disabled={saving || !pwd.currentPassword || !pwd.newPassword || !pwd.confirm}
            >
              <ShieldCheck className="h-4 w-4" /> {saving ? "Salvando..." : "Alterar senha"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {user.lastLoginAt && (
        <p className="anim-fade-up text-center text-xs text-slate-600">
          Último acesso em {formatDate(user.lastLoginAt, true)}
        </p>
      )}
    </div>
  )
}