"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, ClipboardList, Search, Stethoscope, UserRound } from "lucide-react"
import { Card, CardBody, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { todayInput } from "@/lib/utils"

type FormPatient = { id: string; fullName: string; phone: string | null }

export function NewAppointmentForm({
  patients,
  initialPatientId,
  initialMode,
}: {
  patients: FormPatient[]
  initialPatientId?: string
  initialMode: "anamnese" | "evolucao"
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<"anamnese" | "evolucao">(initialMode)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState(patients.find((p) => p.id === initialPatientId)?.fullName ?? "")
  const [selectedPatient, setSelectedPatient] = useState<FormPatient | undefined>(patients.find((p) => p.id === initialPatientId))

  const [evol, setEvol] = useState({
    occurredAt: todayInput(),
    chiefComplaint: "",
    hda: "",
    examFindings: "",
    diagnoses: "",
    procedures: "",
    prescriptions: "",
    observations: "",
    nextReturnAt: "",
  })

  const [anam, setAnam] = useState({
    hasDisease: "",
    diseaseDescription: "",
    underMedicalTreatment: "",
    treatmentDescription: "",
    hospitalized: "",
    surgeryHistory: "",
    surgeryDescription: "",
    hasMedicationAllergy: "",
    anesthesiaReceived: "",
    anesthesiaReaction: "",
    anesthesiaDetails: "",
    smoking: "",
    alcohol: "",
    familyHistory: "",
    observations: "",
  })

  const setE = (k: string, v: string) => setEvol((f) => ({ ...f, [k]: v }))
  const setA = (k: string, v: string) => setAnam((f) => ({ ...f, [k]: v }))

  const filtered = patients
    .filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)

  const pickPatient = (p: FormPatient) => {
    setSelectedPatient(p)
    setQuery(p.fullName)
  }

  const submitEvolucao = async () => {
    if (!selectedPatient) {
      toast("Selecione o paciente.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/app/clinical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatient.id, ...evol }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar.")
      toast("Evolução registrada.", "success")
      router.push(`/app/pacientes/${selectedPatient.id}`)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const submitAnamnese = async () => {
    if (!selectedPatient) {
      toast("Selecione o paciente.", "error")
      return
    }
    setSaving(true)
    try {
      const data = {
        patientId: selectedPatient.id,
        ...anam,
        hasDisease: anam.hasDisease === "sim" ? true : anam.hasDisease === "nao" ? false : null,
        underMedicalTreatment: anam.underMedicalTreatment === "sim" ? true : anam.underMedicalTreatment === "nao" ? false : null,
        hospitalized: anam.hospitalized === "sim" ? true : anam.hospitalized === "nao" ? false : null,
        surgeryHistory: anam.surgeryHistory === "sim" ? true : anam.surgeryHistory === "nao" ? false : null,
        hasMedicationAllergy: anam.hasMedicationAllergy === "sim" ? true : anam.hasMedicationAllergy === "nao" ? false : null,
        anesthesiaReceived: anam.anesthesiaReceived === "sim" ? true : anam.anesthesiaReceived === "nao" ? false : null,
        anesthesiaReaction: anam.anesthesiaReaction === "sim" ? true : anam.anesthesiaReaction === "nao" ? false : null,
        smoking: anam.smoking === "sim" ? true : anam.smoking === "nao" ? false : null,
        alcohol: anam.alcohol === "sim" ? true : anam.alcohol === "nao" ? false : null,
      }
      const res = await fetch("/api/app/anamnesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error || "Erro ao salvar anamnese.")
      toast("Anamnese registrada.", "success")
      router.push(`/app/pacientes/${selectedPatient.id}`)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up">
        <Link href="/app/pacientes" className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-sky-300">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-white">
          Novo <span className="text-gradient">atendimento</span>
        </h1>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setMode("evolucao")}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              mode === "evolucao" ? "border-sky-500/40 bg-sky-500/10 text-sky-300" : "border-[#1c2942] bg-[#0a1120] text-slate-400 hover:text-slate-200"
            }`}
          >
            <Stethoscope className="h-4 w-4" /> Evolução clínica
          </button>
          <button
            onClick={() => setMode("anamnese")}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              mode === "anamnese" ? "border-sky-500/40 bg-sky-500/10 text-sky-300" : "border-[#1c2942] bg-[#0a1120] text-slate-400 hover:text-slate-200"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Anamnese
          </button>
        </div>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="Paciente" subtitle="Selecione o paciente deste atendimento." />
        <CardBody className="space-y-3">
          <Field label="Buscar paciente" required>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome do paciente..." className="pl-9" />
            </div>
          </Field>
          {query && filtered.length > 0 && (
            <div className="space-y-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPatient(p)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                    selectedPatient?.id === p.id
                      ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
                      : "border-[#1c2942] bg-[#0a1120] text-slate-300 hover:border-sky-700/50"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-500" /> {p.fullName}
                  </span>
                  {p.phone && <span className="text-xs text-slate-600">{p.phone}</span>}
                </button>
              ))}
            </div>
          )}
          {query && filtered.length === 0 && (
            <p className="text-xs text-slate-600">
              Nenhum paciente encontrado.{" "}
              <Link href="/app/pacientes/novo" className="text-sky-400 hover:text-sky-300">Cadastrar novo paciente</Link>
            </p>
          )}
        </CardBody>
      </Card>

      {mode === "evolucao" && selectedPatient && (
        <>
          <Card className="anim-fade-up">
            <CardHeader title="Queixa e história" subtitle="O que o paciente relata." />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Data do atendimento">
                  <Input type="date" value={evol.occurredAt} onChange={(e) => setE("occurredAt", e.target.value)} max={todayInput()} />
                </Field>
                <Field label="Próximo retorno">
                  <Input type="date" value={evol.nextReturnAt} onChange={(e) => setE("nextReturnAt", e.target.value)} />
                </Field>
              </div>
              <Field label="Queixa principal">
                <Textarea value={evol.chiefComplaint} onChange={(e) => setE("chiefComplaint", e.target.value)} rows={2} placeholder="Motivo da consulta" />
              </Field>
              <Field label="História da doença atual (HDA)">
                <Textarea value={evol.hda} onChange={(e) => setE("hda", e.target.value)} rows={3} placeholder="Quando começou, evolução, sintomas..." />
              </Field>
            </CardBody>
          </Card>

          <Card className="anim-fade-up">
            <CardHeader title="Exame e diagnóstico" subtitle="Achados objetivos." />
            <CardBody className="space-y-4">
              <Field label="Achados do exame clínico">
                <Textarea value={evol.examFindings} onChange={(e) => setE("examFindings", e.target.value)} rows={3} placeholder="Inspeção, palpação, sondagem, mobilidade..." />
              </Field>
              <Field label="Diagnóstico(s)">
                <Textarea value={evol.diagnoses} onChange={(e) => setE("diagnoses", e.target.value)} rows={2} placeholder="Diagnóstico principal e diferenciais" />
              </Field>
              <Field label="Procedimentos realizados">
                <Textarea value={evol.procedures} onChange={(e) => setE("procedures", e.target.value)} rows={3} placeholder="Tratamento executado nesta sessão" />
              </Field>
            </CardBody>
          </Card>

          <Card className="anim-fade-up">
            <CardHeader title="Prescrições e observações" />
            <CardBody className="space-y-4">
              <Field label="Prescrições">
                <Textarea value={evol.prescriptions} onChange={(e) => setE("prescriptions", e.target.value)} rows={3} placeholder="Medicamentos, posologia, orientações..." />
              </Field>
              <Field label="Observações">
                <Textarea value={evol.observations} onChange={(e) => setE("observations", e.target.value)} rows={2} placeholder="Orientações adicionais" />
              </Field>
            </CardBody>
          </Card>

          <div className="anim-fade-up flex items-center justify-end gap-3 pb-4">
            <Link href="/app/pacientes"><Button variant="ghost">Cancelar</Button></Link>
            <Button onClick={submitEvolucao} disabled={saving}>
              <Check className="h-4 w-4" /> {saving ? "Salvando..." : "Registrar evolução"}
            </Button>
          </div>
        </>
      )}

      {mode === "anamnese" && selectedPatient && (
        <>
          <Card className="anim-fade-up">
            <CardHeader title="História médica" subtitle="Condições de saúde pré-existentes." />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Doença pré-existente">
                  <Select value={anam.hasDisease} onChange={(e) => setA("hasDisease", e.target.value)}>
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
                <Field label="Está sob tratamento médico?">
                  <Select value={anam.underMedicalTreatment} onChange={(e) => setA("underMedicalTreatment", e.target.value)}>
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
              </div>
              {anam.hasDisease === "sim" && (
                <Field label="Descreva a doença">
                  <Textarea value={anam.diseaseDescription} onChange={(e) => setA("diseaseDescription", e.target.value)} rows={2} />
                </Field>
              )}
              {anam.underMedicalTreatment === "sim" && (
                <Field label="Tratamento atual">
                  <Textarea value={anam.treatmentDescription} onChange={(e) => setA("treatmentDescription", e.target.value)} rows={2} />
                </Field>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Já foi hospitalizado?">
                  <Select value={anam.hospitalized} onChange={(e) => setA("hospitalized", e.target.value)}>
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
                <Field label="Já passou por cirurgias?">
                  <Select value={anam.surgeryHistory} onChange={(e) => setA("surgeryHistory", e.target.value)}>
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
              </div>
              {anam.surgeryHistory === "sim" && (
                <Field label="Quais cirurgias?">
                  <Textarea value={anam.surgeryDescription} onChange={(e) => setA("surgeryDescription", e.target.value)} rows={2} />
                </Field>
              )}
            </CardBody>
          </Card>

          <Card className="anim-fade-up">
            <CardHeader title="Alergias e anestesia" subtitle="Reações e contraindicações." />
            <CardBody className="space-y-4">
              <Field label="Alergia a medicamentos?">
                <Select value={anam.hasMedicationAllergy} onChange={(e) => setA("hasMedicationAllergy", e.target.value)}>
                  <option value="">Não informado</option>
                  <option value="nao">Não</option>
                  <option value="sim">Sim</option>
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Já recebeu anestesia odontológica?">
                  <Select value={anam.anesthesiaReceived} onChange={(e) => setA("anesthesiaReceived", e.target.value)}>
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
                <Field label="Teve alguma reação?">
                  <Select value={anam.anesthesiaReaction} onChange={(e) => setA("anesthesiaReaction", e.target.value)}>
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
              </div>
              {anam.anesthesiaReaction === "sim" && (
                <Field label="Descreva a reação">
                  <Textarea value={anam.anesthesiaDetails} onChange={(e) => setA("anesthesiaDetails", e.target.value)} rows={2} />
                </Field>
              )}
            </CardBody>
          </Card>

          <Card className="anim-fade-up">
            <CardHeader title="Hábitos" subtitle="Fatores que influenciam a saúde bucal." />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tabagismo?">
                  <Select value={anam.smoking} onChange={(e) => setA("smoking", e.target.value)}>
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
                <Field label="Consumo de álcool?">
                  <Select value={anam.alcohol} onChange={(e) => setA("alcohol", e.target.value)}>
                    <option value="">Não informado</option>
                    <option value="nao">Não</option>
                    <option value="sim">Sim</option>
                  </Select>
                </Field>
              </div>
              <Field label="Histórico familiar relevante">
                <Textarea value={anam.familyHistory} onChange={(e) => setA("familyHistory", e.target.value)} rows={2} placeholder="Doenças comuns na família..." />
              </Field>
              <Field label="Observações">
                <Textarea value={anam.observations} onChange={(e) => setA("observations", e.target.value)} rows={2} />
              </Field>
            </CardBody>
          </Card>

          <div className="anim-fade-up flex items-center justify-end gap-3 pb-4">
            <Link href="/app/pacientes"><Button variant="ghost">Cancelar</Button></Link>
            <Button onClick={submitAnamnese} disabled={saving}>
              <Check className="h-4 w-4" /> {saving ? "Salvando..." : "Registrar anamnese"}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}