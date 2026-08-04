"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, Save, ShieldCheck } from "lucide-react"
import { Card, CardBody, CardHeader } from "@/components/ui/card"
import { Button, LinkButton } from "@/components/ui/button"
import { Field, Input, Textarea } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { formatCnpj } from "@/lib/utils"

type ClinicData = {
  name: string
  legalName: string | null
  cnpj: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  cep: string | null
  responsible: string | null
  cro: string | null
  reportHeader: string | null
  reportFooter: string | null
}

export function ClinicPage({ clinic, canEdit }: { clinic: ClinicData | null; canEdit: boolean }) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: clinic?.name ?? "",
    legalName: clinic?.legalName ?? "",
    cnpj: clinic?.cnpj ?? "",
    phone: clinic?.phone ?? "",
    whatsapp: clinic?.whatsapp ?? "",
    email: clinic?.email ?? "",
    address: clinic?.address ?? "",
    city: clinic?.city ?? "",
    state: clinic?.state ?? "",
    cep: clinic?.cep ?? "",
    responsible: clinic?.responsible ?? "",
    cro: clinic?.cro ?? "",
    reportHeader: clinic?.reportHeader ?? "",
    reportFooter: clinic?.reportFooter ?? "",
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) {
      toast("Informe o nome da clínica.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/app/clinic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      toast("Clínica atualizada.", "success")
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  if (!clinic) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-center text-sm text-slate-500">Nenhuma clínica vinculada à sua conta.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up">
        <LinkButton href="/app/configuracoes" variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </LinkButton>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Dados da <span className="text-gradient">clínica</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Informações institucionais usadas em relatórios e atendimentos.
          {!canEdit && " Apenas o administrador pode editar."}
        </p>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="Identificação" subtitle="Razão social e registro." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome fantasia" required>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} disabled={!canEdit} />
            </Field>
            <Field label="Razão social">
              <Input value={form.legalName} onChange={(e) => set("legalName", e.target.value)} disabled={!canEdit} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="CNPJ">
              <Input value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} disabled={!canEdit} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="Responsável técnico">
              <Input value={form.responsible} onChange={(e) => set("responsible", e.target.value)} disabled={!canEdit} />
            </Field>
            <Field label="CRO">
              <Input value={form.cro} onChange={(e) => set("cro", e.target.value)} disabled={!canEdit} placeholder="00000-SP" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Contato" />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} disabled={!canEdit} />
            </Field>
            <Field label="WhatsApp">
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} disabled={!canEdit} />
            </Field>
          </div>
          <Field label="E-mail">
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" disabled={!canEdit} />
          </Field>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Endereço" />
        <CardBody className="space-y-4">
          <Field label="Endereço">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} disabled={!canEdit} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} disabled={!canEdit} />
            </Field>
            <Field label="UF">
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} disabled={!canEdit} />
            </Field>
            <Field label="CEP">
              <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} disabled={!canEdit} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Relatórios" subtitle="Texto exibido no topo e no rodapé dos documentos gerados." />
        <CardBody className="space-y-4">
          <Field label="Cabeçalho">
            <Textarea value={form.reportHeader} onChange={(e) => set("reportHeader", e.target.value)} rows={2} disabled={!canEdit} placeholder="Ex.: Clínica Sorriso — Rua das Flores, 123 — CRO-SP 1234" />
          </Field>
          <Field label="Rodapé">
            <Textarea value={form.reportFooter} onChange={(e) => set("reportFooter", e.target.value)} rows={2} disabled={!canEdit} placeholder="Ex.: Atenciosamente, equipe..." />
          </Field>
        </CardBody>
      </Card>

      {canEdit && (
        <div className="anim-fade-up flex items-center justify-end gap-3 pb-4">
          <Button onClick={save} disabled={saving || !form.name.trim()}>
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      )}
    </div>
  )
}