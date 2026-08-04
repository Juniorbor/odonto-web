"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronDown } from "lucide-react"
import { Card, CardBody, CardHeader, Badge } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"
import { cn, formatDate, todayInput } from "@/lib/utils"

type TriState = "" | "sim" | "nao"

type HistoryRow = {
  id: string
  version: number
  signedByName: string | null
  signedAt: string | null
  createdAt: string
  lastDentalVisit: string | null
} & Record<string, unknown>

const BOOL_FIELDS: [string, string][] = [
  ["hasDisease", "Doença pré-existente"],
  ["underMedicalTreatment", "Sob tratamento médico"],
  ["hospitalized", "Já foi hospitalizado(a)"],
  ["surgeryHistory", "Já passou por cirurgias"],
  ["cardiovascular", "Problemas cardiovasculares"],
  ["hypertension", "Hipertensão"],
  ["diabetes", "Diabetes"],
  ["respiratory", "Doenças respiratórias"],
  ["renal", "Doenças renais"],
  ["hepatic", "Doenças hepáticas"],
  ["coagulation", "Distúrbios de coagulação"],
  ["infectious", "Doenças infectocontagiosas"],
  ["autoimmune", "Doenças autoimunes"],
  ["cancerHistory", "Histórico de câncer"],
  ["epilepsy", "Epilepsia"],
  ["pressureChanges", "Alterações de pressão"],
  ["faintingHistory", "Já desmaiou em consulta"],
  ["seizuresHistory", "Convulsões"],
  ["hasMedicationAllergy", "Alergia a medicamentos"],
  ["anesthesiaReceived", "Já recebeu anestesia odontológica"],
  ["anesthesiaReaction", "Teve reação à anestesia"],
  ["hasPain", "Sente dor"],
  ["sensitivity", "Sensibilidade dentária"],
  ["gumBleeding", "Sangramento gengival"],
  ["halitosis", "Halitose"],
  ["bruxism", "Bruxismo"],
  ["clenching", "Aperto dental"],
  ["dentalTrauma", "Trauma dentário"],
  ["orthodonticTreatment", "Tratamento ortodôntico"],
  ["prostheses", "Usa próteses"],
  ["implants", "Possui implantes"],
  ["previousSurgeries", "Cirurgias bucais anteriores"],
  ["flossUse", "Usa fio dental"],
  ["mouthwashUse", "Usa enxaguante bucal"],
  ["smoking", "Tabagismo"],
  ["alcohol", "Consumo de álcool"],
  ["nailBiting", "Rói unhas"],
  ["parafunctionalHabits", "Hábitos parafuncionais"],
]

const BOOL_KEYS = new Set(BOOL_FIELDS.map(([k]) => k))

const MEDICAL_CONDITIONS = BOOL_FIELDS.filter(([k]) =>
  [
    "cardiovascular",
    "hypertension",
    "diabetes",
    "respiratory",
    "renal",
    "hepatic",
    "coagulation",
    "infectious",
    "autoimmune",
    "cancerHistory",
    "epilepsy",
    "pressureChanges",
    "faintingHistory",
    "seizuresHistory",
  ].includes(k),
)

function TriSelect({ value, onChange, label }: { value: TriState; onChange: (v: TriState) => void; label: string }) {
  return (
    <Field label={label}>
      <Select value={value} onChange={(e) => onChange(e.target.value as TriState)}>
        <option value="">Não informado</option>
        <option value="nao">Não</option>
        <option value="sim">Sim</option>
      </Select>
    </Field>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card className="anim-fade-up">
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  )
}

export function PatientAnamnesis({ patientId, patientName }: { patientId: string; patientName: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [histories, setHistories] = useState<HistoryRow[] | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [form, setForm] = useState<Record<string, string>>({
    signedByName: "",
    lastDentalVisit: "",
    diseaseDescription: "",
    treatmentDescription: "",
    surgeryDescription: "",
    anesthesiaDetails: "",
    painDescription: "",
    habitsDetails: "",
    familyHistory: "",
    observations: "",
    brushFrequency: "",
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const tri = (k: string) => (form[k] as TriState) ?? ""
  const setTri = (k: string, v: TriState) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/app/anamnesis?patientId=${patientId}`)
        const data = await res.json()
        if (res.ok) setHistories(data.histories ?? [])
      } catch {
        setHistories([])
      }
    })()
  }, [patientId])

  const submit = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { patientId }
      for (const [k, v] of Object.entries(form)) {
        if (BOOL_KEYS.has(k)) payload[k] = v === "sim" ? true : v === "nao" ? false : null
        else payload[k] = v
      }
      const res = await fetch("/api/app/anamnesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const out = await res.json()
      if (!res.ok) throw new Error(out.error || "Erro ao salvar anamnese.")
      toast("Anamnese registrada.", "success")
      setForm({
        signedByName: "",
        lastDentalVisit: "",
        diseaseDescription: "",
        treatmentDescription: "",
        surgeryDescription: "",
        anesthesiaDetails: "",
        painDescription: "",
        habitsDetails: "",
        familyHistory: "",
        observations: "",
        brushFrequency: "",
      })
      const res2 = await fetch(`/api/app/anamnesis?patientId=${patientId}`)
      const data2 = await res2.json()
      if (res2.ok) setHistories(data2.histories ?? [])
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const boolLabel = (v: unknown) => (v === true ? "Sim" : v === false ? "Não" : null)
  const answeredPairs = (h: HistoryRow): [string, string][] => {
    const pairs: [string, string][] = []
    for (const [k, label] of BOOL_FIELDS) {
      const v = boolLabel(h[k])
      if (v) pairs.push([label, v])
    }
    const textMap: [string, string][] = [
      ["signedByName", "Assinado por"],
      ["diseaseDescription", "Descrição da doença"],
      ["treatmentDescription", "Tratamento atual"],
      ["surgeryDescription", "Cirurgias"],
      ["anesthesiaDetails", "Reação à anestesia"],
      ["painDescription", "Descrição da dor"],
      ["brushFrequency", "Frequência de escovação"],
      ["habitsDetails", "Detalhes dos hábitos"],
      ["familyHistory", "Histórico familiar"],
      ["observations", "Observações"],
    ]
    for (const [k, label] of textMap) {
      const v = typeof h[k] === "string" && h[k] ? (h[k] as string).trim() : ""
      if (v) pairs.push([label, v])
    }
    if (h.lastDentalVisit) pairs.push(["Última consulta odontológica", formatDate(String(h.lastDentalVisit))])
    return pairs
  }

  return (
    <div className="space-y-6 pb-4">
      <Section title="Identificação" subtitle="Quem preenche e quando foi a última consulta.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assinado por (paciente/responsável)">
            <Input value={form.signedByName} onChange={(e) => set("signedByName", e.target.value)} placeholder="Nome de quem assina o documento" />
          </Field>
          <Field label="Última consulta odontológica">
            <Input type="date" value={form.lastDentalVisit} onChange={(e) => set("lastDentalVisit", e.target.value)} max={todayInput()} />
          </Field>
        </div>
      </Section>

      <Section title="História médica" subtitle="Condições de saúde pré-existentes.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TriSelect label="Doença pré-existente" value={tri("hasDisease")} onChange={(v) => setTri("hasDisease", v)} />
          <TriSelect label="Sob tratamento médico" value={tri("underMedicalTreatment")} onChange={(v) => setTri("underMedicalTreatment", v)} />
        </div>
        {tri("hasDisease") === "sim" && (
          <Field label="Descreva a doença">
            <Textarea value={form.diseaseDescription} onChange={(e) => set("diseaseDescription", e.target.value)} rows={2} />
          </Field>
        )}
        {tri("underMedicalTreatment") === "sim" && (
          <Field label="Tratamento atual">
            <Textarea value={form.treatmentDescription} onChange={(e) => set("treatmentDescription", e.target.value)} rows={2} />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TriSelect label="Já foi hospitalizado(a)" value={tri("hospitalized")} onChange={(v) => setTri("hospitalized", v)} />
          <TriSelect label="Já passou por cirurgias" value={tri("surgeryHistory")} onChange={(v) => setTri("surgeryHistory", v)} />
        </div>
        {tri("surgeryHistory") === "sim" && (
          <Field label="Quais cirurgias?">
            <Textarea value={form.surgeryDescription} onChange={(e) => set("surgeryDescription", e.target.value)} rows={2} />
          </Field>
        )}
        <div className="grid gap-4 border-t border-[#16213a] pt-4 sm:grid-cols-2">
          {MEDICAL_CONDITIONS.map(([k, label]) => (
            <TriSelect key={k} label={label} value={tri(k)} onChange={(v) => setTri(k, v)} />
          ))}
        </div>
      </Section>

      <Section title="Alergias e anestesia" subtitle="Reações e contraindicações.">
        <div className="grid gap-4 sm:grid-cols-3">
          <TriSelect label="Alergia a medicamentos" value={tri("hasMedicationAllergy")} onChange={(v) => setTri("hasMedicationAllergy", v)} />
          <TriSelect label="Já recebeu anestesia odontológica" value={tri("anesthesiaReceived")} onChange={(v) => setTri("anesthesiaReceived", v)} />
          <TriSelect label="Teve reação" value={tri("anesthesiaReaction")} onChange={(v) => setTri("anesthesiaReaction", v)} />
        </div>
        {tri("anesthesiaReaction") === "sim" && (
          <Field label="Descreva a reação">
            <Textarea value={form.anesthesiaDetails} onChange={(e) => set("anesthesiaDetails", e.target.value)} rows={2} />
          </Field>
        )}
      </Section>

      <Section title="Saúde bucal" subtitle="Queixas e condições orais atuais.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TriSelect label="Sente dor" value={tri("hasPain")} onChange={(v) => setTri("hasPain", v)} />
          <TriSelect label="Sensibilidade dentária" value={tri("sensitivity")} onChange={(v) => setTri("sensitivity", v)} />
        </div>
        {tri("hasPain") === "sim" && (
          <Field label="Onde e como é a dor?">
            <Textarea value={form.painDescription} onChange={(e) => set("painDescription", e.target.value)} rows={2} />
          </Field>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <TriSelect label="Sangramento gengival" value={tri("gumBleeding")} onChange={(v) => setTri("gumBleeding", v)} />
          <TriSelect label="Halitose" value={tri("halitosis")} onChange={(v) => setTri("halitosis", v)} />
          <TriSelect label="Bruxismo" value={tri("bruxism")} onChange={(v) => setTri("bruxism", v)} />
          <TriSelect label="Aperto dental" value={tri("clenching")} onChange={(v) => setTri("clenching", v)} />
          <TriSelect label="Trauma dentário" value={tri("dentalTrauma")} onChange={(v) => setTri("dentalTrauma", v)} />
          <TriSelect label="Tratamento ortodôntico" value={tri("orthodonticTreatment")} onChange={(v) => setTri("orthodonticTreatment", v)} />
          <TriSelect label="Usa próteses" value={tri("prostheses")} onChange={(v) => setTri("prostheses", v)} />
          <TriSelect label="Possui implantes" value={tri("implants")} onChange={(v) => setTri("implants", v)} />
          <TriSelect label="Cirurgias bucais anteriores" value={tri("previousSurgeries")} onChange={(v) => setTri("previousSurgeries", v)} />
        </div>
        <div className="grid gap-4 border-t border-[#16213a] pt-4 sm:grid-cols-3">
          <Field label="Frequência de escovação">
            <Select value={form.brushFrequency} onChange={(e) => set("brushFrequency", e.target.value)}>
              <option value="">Não informado</option>
              <option value="1x ao dia">1x ao dia</option>
              <option value="2x ao dia">2x ao dia</option>
              <option value="3x ou mais ao dia">3x ou mais ao dia</option>
            </Select>
          </Field>
          <TriSelect label="Usa fio dental" value={tri("flossUse")} onChange={(v) => setTri("flossUse", v)} />
          <TriSelect label="Usa enxaguante bucal" value={tri("mouthwashUse")} onChange={(v) => setTri("mouthwashUse", v)} />
        </div>
      </Section>

      <Section title="Hábitos" subtitle="Fatores que influenciam a saúde bucal.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TriSelect label="Tabagismo" value={tri("smoking")} onChange={(v) => setTri("smoking", v)} />
          <TriSelect label="Consumo de álcool" value={tri("alcohol")} onChange={(v) => setTri("alcohol", v)} />
          <TriSelect label="Rói unhas" value={tri("nailBiting")} onChange={(v) => setTri("nailBiting", v)} />
          <TriSelect label="Hábitos parafuncionais" value={tri("parafunctionalHabits")} onChange={(v) => setTri("parafunctionalHabits", v)} />
        </div>
        {tri("parafunctionalHabits") === "sim" && (
          <Field label="Quais hábitos?">
            <Textarea value={form.habitsDetails} onChange={(e) => set("habitsDetails", e.target.value)} rows={2} />
          </Field>
        )}
        <Field label="Histórico familiar relevante">
          <Textarea value={form.familyHistory} onChange={(e) => set("familyHistory", e.target.value)} rows={2} placeholder="Doenças comuns na família..." />
        </Field>
        <Field label="Observações">
          <Textarea value={form.observations} onChange={(e) => set("observations", e.target.value)} rows={2} />
        </Field>
      </Section>

      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3 pb-4">
        <p className="text-xs text-slate-500">
          Uma nova versão é criada a cada registro — o histórico completo fica salvo para {patientName}.
        </p>
        <div className="flex items-center gap-2">
          <Link href={`/app/pacientes/${patientId}`}>
            <Button variant="ghost">Cancelar</Button>
          </Link>
          <Button onClick={submit} disabled={saving}>
            <Check className="h-4 w-4" /> {saving ? "Salvando..." : "Registrar anamnese"}
          </Button>
        </div>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="Histórico de anamneses" subtitle="Versões anteriores registradas." />
        <CardBody>
          {histories === null ? (
            <p className="text-sm text-slate-600">Carregando...</p>
          ) : histories.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhuma anamnese registrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {histories.map((h) => {
                const pairs = answeredPairs(h)
                const open = expanded === h.id
                return (
                  <div key={h.id} className="rounded-xl border border-[#16213a] bg-[#0b1220]">
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : h.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">Versão v{h.version}</span>
                        {h.signedByName && <span className="text-xs text-slate-500">por {h.signedByName}</span>}
                        <Badge tone="info">{formatDate(String(h.createdAt))}</Badge>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-slate-500 transition", open && "rotate-180")} />
                    </button>
                    {open && (
                      <div className="border-t border-[#16213a] px-4 py-3">
                        {pairs.length === 0 ? (
                          <p className="text-sm text-slate-600">Sem respostas preenchidas.</p>
                        ) : (
                          <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                            {pairs.map(([label, value]) => (
                              <div key={label} className="flex items-baseline justify-between gap-3 border-b border-[#101a2e] py-1 text-sm last:border-0">
                                <dt className="text-xs text-slate-500">{label}</dt>
                                <dd className="text-right text-slate-300">{value}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}