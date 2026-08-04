"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, KeyRound, Lock, Mail, Phone, Plus, ShieldCheck, Trash2, UserCog, UserPlus, UserRound } from "lucide-react"
import { Card, CardBody, CardHeader } from "@/components/ui/card"
import { Button, LinkButton } from "@/components/ui/button"
import { Field, Input, Select } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { initials, formatDate } from "@/lib/utils"

type UserRow = {
  id: string
  name: string
  email: string
  role: "CLINIC_ADMIN" | "PROFESSIONAL" | "RECEPTION"
  active: boolean
  title: string | null
  phone: string | null
  lastLoginAt: string | null
  createdAt: string
}

const ROLE_LABEL: Record<string, string> = {
  CLINIC_ADMIN: "Administrador",
  PROFESSIONAL: "Profissional",
  RECEPTION: "Recepcionista",
}

const ROLE_TONE: Record<string, string> = {
  CLINIC_ADMIN: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  PROFESSIONAL: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  RECEPTION: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
}

export function UsersPage({
  users: initialUsers,
  userLimit,
  canManage,
}: {
  users: UserRow[]
  userLimit: number
  canManage: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState(initialUsers)
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [removing, setRemoving] = useState<UserRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PROFESSIONAL", title: "", phone: "" })

  const activeCount = useMemo(() => users.filter((u) => u.active).length, [users])

  const submit = async () => {
    setSaving(true)
    try {
      const res = await fetch(editing ? `/api/app/users/${editing.id}` : "/api/app/users", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      toast(editing ? "Usuário atualizado." : "Usuário criado com sucesso.", "success")
      setOpenCreate(false)
      setEditing(null)
      router.refresh()
      const upd = await (await fetch("/api/app/users")).json()
      if (upd.users) setUsers(upd.users)
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: UserRow) => {
    if (!canManage) return
    try {
      const res = await fetch(`/api/app/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast(u.active ? "Acesso desativado." : "Acesso reativado.", "info")
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, active: !x.active } : x)))
    } catch (e) {
      toast((e as Error).message, "error")
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/app/users/${removing.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao remover.")
      toast("Usuário removido.", "success")
      setUsers((prev) => prev.filter((x) => x.id !== removing.id))
      setRemoving(null)
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <LinkButton href="/app/configuracoes" variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </LinkButton>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">
            Usuários <span className="text-gradient">&amp; Equipe</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie quem tem acesso à conta da clínica.
            {canManage && (
              <span className="ml-1 text-slate-400">
                {activeCount}/{userLimit} ativos no plano.
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setForm({ name: "", email: "", password: "", role: "PROFESSIONAL", title: "", phone: "" })
              setEditing(null)
              setOpenCreate(true)
            }}
          >
            <UserPlus className="h-4 w-4" /> Novo usuário
          </Button>
        )}
      </div>

      <div className="anim-fade-up stagger space-y-3">
        {users.length === 0 ? (
          <Card>
            <CardBody>
              <p className="py-10 text-center text-sm text-slate-500">
                Nenhum usuário nesta clínica ainda. {canManage && "Clique em \"Novo usuário\" para começar."}
              </p>
            </CardBody>
          </Card>
        ) : (
          users.map((u) => (
            <Card key={u.id} className="transition hover:-translate-y-0.5">
              <CardBody>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-xs font-bold text-white">
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {u.name} {u.title && <span className="font-normal text-slate-500">· {u.title}</span>}
                      </p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${ROLE_TONE[u.role]}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                      {!u.active && (
                        <span className="rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                          Acesso desativado
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {u.email}</span>
                      {u.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {u.phone}</span>}
                      <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" /> Entrou em {formatDate(u.createdAt)}</span>
                      {u.lastLoginAt && <span>Último login: {formatDate(u.lastLoginAt, true)}</span>}
                    </div>
                  </div>
                  {canManage && u.role !== "CLINIC_ADMIN" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(u)
                          setForm({
                            name: u.name,
                            email: u.email,
                            password: "",
                            role: u.role,
                            title: u.title ?? "",
                            phone: u.phone ?? "",
                          })
                        }}
                      >
                        <UserCog className="h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(u)}>
                        <Lock className="h-3.5 w-3.5" /> {u.active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => setRemoving(u)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {!canManage && (
        <Card>
          <CardBody>
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              Apenas o administrador da clínica pode gerenciar usuários.
            </p>
          </CardBody>
        </Card>
      )}

      <Modal
        open={openCreate || !!editing}
        onClose={() => { setOpenCreate(false); setEditing(null) }}
        title={editing ? "Editar usuário" : "Novo usuário"}
      >
        <div className="space-y-4">
          <Field label="Nome completo" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dra. Maria Silva" />
          </Field>
          <Field label="E-mail" required>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="maria@clinica.com.br" type="email" />
          </Field>
          <Field label="Função / título">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ortodontista" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Perfil de acesso" required>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="PROFESSIONAL">Profissional (CRO)</option>
                <option value="RECEPTION">Recepcionista</option>
                <option value="CLINIC_ADMIN">Administrador da clínica</option>
              </Select>
            </Field>
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </Field>
          </div>
          <Field label={editing ? "Nova senha (opcional)" : "Senha"} required={!editing}>
            <Input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              placeholder={editing ? "Deixe vazio para manter" : "Mínimo 6 caracteres"}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => { setOpenCreate(false); setEditing(null) }}>Cancelar</Button>
            <Button onClick={submit} disabled={saving || !form.name || !form.email || (!editing && !form.password)}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Remover usuário"
        message={`Tem certeza que deseja remover ${removing?.name}? O acesso será desativado e o vínculo com a clínica será encerrado. Os registros clínicos anteriores serão preservados.`}
        confirmLabel={saving ? "Removendo..." : "Remover usuário"}
        danger
      />
    </div>
  )
}
