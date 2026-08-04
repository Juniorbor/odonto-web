"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, MapPin, Phone, UserPlus } from "lucide-react"
import { Card, CardBody, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { todayInput } from "@/lib/utils"

export type PatientFormData = {
  id: string
  fullName: string
  socialName: string | null
  cpf: string | null
  rg: string | null
  birthDate: string | null
  sex: string | null
  maritalStatus: string | null
  occupation: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  cep: string | null
  guardian: string | null
  observations: string | null
}

export function PatientForm({ patient }: { patient?: PatientFormData }) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: patient?.fullName ?? "",
    socialName: patient?.socialName ?? "",
    cpf: patient?.cpf ?? "",
    rg: patient?.rg ?? "",
    birthDate: patient?.birthDate ? patient.birthDate.slice(0, 10) : "",
    sex: patient?.sex ?? "",
    maritalStatus: patient?.maritalStatus ?? "",
    occupation: patient?.occupation ?? "",
    phone: patient?.phone ?? "",
    whatsapp: patient?.whatsapp ?? "",
    email: patient?.email ?? "",
    address: patient?.address ?? "",
    city: patient?.city ?? "",
    state: patient?.state ?? "",
    cep: patient?.cep ?? "",
    guardian: patient?.guardian ?? "",
    observations: patient?.observations ?? "",
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.fullName.trim()) {
      toast("Informe o nome do paciente.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(patient ? `/api/app/patients/${patient.id}` : "/api/app/patients", {
        method: patient ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      toast(patient ? "Dados atualizados." : "Paciente cadastrado com sucesso.", "success")
      router.push(`/app/pacientes/${data.id ?? patient!.id}`)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up">
        <Link
          href={patient ? `/app/pacientes/${patient.id}` : "/app/pacientes"}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-sky-300"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para pacientes
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">
          {patient ? "Editar " : "Novo "} <span className="text-gradient">paciente</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">Preencha os dados cadastrais. Campos identificados com * são obrigatórios.</p>
      </div>

      <Card className="anim-fade-up">
        <CardHeader
          title="Dados pessoais"
          subtitle="Identificação civil e dados de contato."
         
        />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" required>
              <Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Maria da Silva Santos" />
            </Field>
            <Field label="Nome social">
              <Input value={form.socialName} onChange={(e) => set("socialName", e.target.value)} placeholder="Como deseja ser chamado(a)" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="CPF">
              <Input value={form.cpf} onChange={(e) => set("cpf", e.target.value)} placeholder="000.000.000-00" />
            </Field>
            <Field label="RG">
              <Input value={form.rg} onChange={(e) => set("rg", e.target.value)} placeholder="00.000.000-0" />
            </Field>
            <Field label="Nascimento">
              <Input value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} type="date" max={todayInput()} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Sexo biológico">
              <Select value={form.sex} onChange={(e) => set("sex", e.target.value)}>
                <option value="">Selecione</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="O">Outro</option>
              </Select>
            </Field>
            <Field label="Estado civil">
              <Select value={form.maritalStatus} onChange={(e) => set("maritalStatus", e.target.value)}>
                <option value="">Selecione</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
                <option value="União estável">União estável</option>
              </Select>
            </Field>
            <Field label="Profissão / ocupação">
              <Input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="Autônomo" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Contato" subtitle="Como entrar em contato com o paciente." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 3333-3333" />
            </Field>
            <Field label="WhatsApp">
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="(11) 99999-9999" />
            </Field>
          </div>
          <Field label="E-mail">
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} type="email" placeholder="paciente@email.com" />
          </Field>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Endereço" subtitle="Localização e responsável legal (para menores)." />
        <CardBody className="space-y-4">
          <Field label="Endereço">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Rua, número, bairro" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cidade">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="São Paulo" />
            </Field>
            <Field label="UF">
              <Input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} placeholder="SP" />
            </Field>
            <Field label="CEP">
              <Input value={form.cep} onChange={(e) => set("cep", e.target.value)} placeholder="00000-000" />
            </Field>
          </div>
          <Field label="Responsável (menor de idade)">
            <Input value={form.guardian} onChange={(e) => set("guardian", e.target.value)} placeholder="Nome do responsável legal" />
          </Field>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Observações" subtitle="Anotações gerais internas da equipe." />
        <CardBody>
          <Textarea
            value={form.observations}
            onChange={(e) => set("observations", e.target.value)}
            rows={4}
            placeholder="Histórico, necessidades especiais, preferências de contato..."
          />
        </CardBody>
      </Card>

      <div className="anim-fade-up flex items-center justify-end gap-3 pb-4">
        <Link href="/app/pacientes">
          <Button variant="ghost">Cancelar</Button>
        </Link>
        <Button onClick={submit} disabled={saving || !form.fullName.trim()}>
          {saving ? "Salvando..." : (
            <>
              <Check className="h-4 w-4" /> {patient ? "Salvar alterações" : "Cadastrar paciente"}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}