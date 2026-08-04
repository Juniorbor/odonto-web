"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Field, Select } from "@/components/ui/input"
import { Card, CardBody } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"

type Plan = { id: string; name: string; price: string; description: string | null }

export default function NewClientPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => {})
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setLoading(true)
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          clinicName: fd.get("clinicName") || fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          planId: fd.get("planId") || undefined,
          status: fd.get("status") || "TRIAL",
          startDate: fd.get("startDate") || undefined,
          endDate: fd.get("endDate") || undefined,
          responsibleName: fd.get("responsibleName") || undefined,
          cro: fd.get("cro") || undefined,
          phone: fd.get("phone") || undefined,
          whatsapp: fd.get("whatsapp") || undefined,
          city: fd.get("city") || undefined,
          state: fd.get("state") || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Cliente criado com sucesso!", "success")
      router.push(`/admin/clientes/${data.id}`)
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao criar cliente.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up flex items-center gap-3">
        <Link href="/admin/clientes" className="rounded-lg border border-[#23345a] bg-[#0a1120] p-2 text-slate-400 transition hover:text-sky-300">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Novo cliente</h1>
          <p className="mt-1 text-sm text-slate-500">Cria o cliente, a clínica e o usuário administrador da conta.</p>
        </div>
      </div>

      <form onSubmit={submit} className="anim-fade-up space-y-6">
        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-center gap-3 border-b border-[#1c2942] pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10 text-sky-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Dados do cliente</h3>
                <p className="text-xs text-slate-500">Identificação da conta e da clínica</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do cliente" required>
                <Input name="name" required placeholder="Ex.: Clínica Sorriso Ltda" />
              </Field>
              <Field label="Nome da clínica">
                <Input name="clinicName" placeholder="Nome comercial da clínica" />
              </Field>
              <Field label="Responsável">
                <Input name="responsibleName" placeholder="Nome do profissional responsável" />
              </Field>
              <Field label="CRO">
                <Input name="cro" placeholder="Ex.: 12345-SP" />
              </Field>
              <Field label="Telefone">
                <Input name="phone" placeholder="(00) 0000-0000" />
              </Field>
              <Field label="WhatsApp">
                <Input name="whatsapp" placeholder="(00) 00000-0000" />
              </Field>
              <Field label="Cidade">
                <Input name="city" />
              </Field>
              <Field label="Estado">
                <Input name="state" maxLength={2} placeholder="UF" />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-100">Acesso administrativo</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-mail de acesso" required>
                <Input type="email" name="email" required placeholder="admin@cliente.com.br" />
              </Field>
              <Field label="Senha inicial" required hint="Mínimo de 6 caracteres">
                <Input type="password" name="password" required minLength={6} placeholder="••••••••" />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5">
            <h3 className="text-sm font-semibold text-slate-100">Plano e assinatura</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plano" required>
                <Select name="planId" defaultValue="">
                  <option value="">Selecionar plano...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.price}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Status inicial">
                <Select name="status" defaultValue="TRIAL">
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="SUSPENDED">Suspenso</option>
                </Select>
              </Field>
              <Field label="Início da assinatura">
                <Input type="date" name="startDate" />
              </Field>
              <Field label="Vencimento da assinatura">
                <Input type="date" name="endDate" />
              </Field>
            </div>
          </CardBody>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/clientes" className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium text-slate-400 hover:text-slate-200">
            Cancelar
          </Link>
          <Button type="submit" size="lg" loading={loading}>
            Criar cliente
          </Button>
        </div>
      </form>
    </div>
  )
}