"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Plus, Search, Trash2, TrendingUp } from "lucide-react"
import { Card, CardBody, Badge } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { EmptyState } from "@/components/ui/feedback"
import { formatCurrency, formatDate, monthKey } from "@/lib/utils"

type ProdCat = { id: string; name: string; type: string; price: string | null }
type ProdRow = {
  id: string
  code: string
  date: string
  patientName: string | null
  patientId: string | null
  serviceName: string
  serviceType: string
  value: string
  status: string
  notes: string | null
  category: { id: string; name: string } | null
}
type ProdPatient = { id: string; fullName: string }

const TYPE_LABEL: Record<string, string> = {
  TOMO: "Tomografia",
  TRACADO: "Traçado",
  FERNANDO: "Fernando",
  BERNARDO: "Bernardo",
  OUTRO: "Outros",
}

const GROUPS = [
  { key: "FERNANDO", label: "Fernando" },
  { key: "BERNARDO", label: "Bernardo" },
  { key: "OUTROS", label: "Outros" },
] as const

const SERVICE_EXAMS = ["Traçado", "Um dente", "Maxila e Mandíbula", "Maxila", "Mandíbula"] as const

const SERVICE_VALUE: Record<string, string> = {
  Traçado: "4,00",
  "Um dente": "10,00",
  "Maxila e Mandíbula": "20,00",
  Maxila: "15,00",
  Mandíbula: "15,00",
}

const parseBRL = (v: string): number => {
  const n = parseFloat(v.replace(/\./g, "").replace(",", "."))
  return Number.isNaN(n) ? NaN : n
}

export function ProductionPage({
  patients,
  categories,
  canManageCategories,
}: {
  patients: ProdPatient[]
  categories: ProdCat[]
  canManageCategories: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [month, setMonth] = useState(monthKey(new Date()))
  const [rows, setRows] = useState<ProdRow[]>([])
  const [totalValue, setTotalValue] = useState("0")
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<ProdRow | null>(null)
  const [query, setQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<ProdPatient | null>(null)
  const [form, setForm] = useState({
    date: `${month}-01`,
    patientName: "",
    serviceName: "",
    serviceChoice: "",
    serviceType: "",
    categoryId: "",
    value: "",
    status: "DONE",
    notes: "",
  })

  const fetchMonth = useCallback(
    async (m: string) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/app/production?month=${m}`)
        const data = await res.json()
        if (res.ok) {
          setRows(data.records)
          setTotalValue(data.totals.value)
          setTotalCount(data.totals.count)
        }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchMonth(month)
  }, [month, fetchMonth])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const pickService = (choice: string) => {
    if (choice === "OUTRO") {
      setForm((f) => ({ ...f, serviceChoice: "OUTRO", serviceName: "" }))
      return
    }
    setForm((f) => ({ ...f, serviceChoice: choice, serviceName: choice, value: SERVICE_VALUE[choice] ?? f.value }))
  }

  const pickType = (t: string) => setForm((f) => ({ ...f, serviceType: t, categoryId: "" }))

  const clinicOptions = form.serviceType ? categories.filter((c) => c.type === form.serviceType) : []

  const submit = async () => {
    if (!form.serviceName.trim()) {
      toast("Informe o serviço.", "error")
      return
    }
    const valueNum = parseBRL(form.value)
    if (!form.value.trim() || Number.isNaN(valueNum) || valueNum <= 0) {
      toast("Informe o valor.", "error")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/app/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          patientId: selectedPatient?.id,
          value: valueNum,
          serviceType: form.serviceType || "OUTRO",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao registrar.")
      toast(`Produção registrada — ${data.code}`, "success")
      setShowNew(false)
      setSelectedPatient(null)
      setQuery("")
      setForm({ date: `${month}-01`, patientName: "", serviceName: "", serviceChoice: "", serviceType: "", categoryId: "", value: "", status: "DONE", notes: "" })
      fetchMonth(month)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/app/production/${removing.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast("Produção excluída.", "success")
      setRemoving(null)
      fetchMonth(month)
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const filtered = patients.filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase())).slice(0, 6)

  const grouped = GROUPS.map((g) => {
    const items = rows.filter((r) =>
      g.key === "OUTROS" ? r.serviceType !== "FERNANDO" && r.serviceType !== "BERNARDO" : r.serviceType === g.key,
    )
    const subtotal = items.reduce((sum, r) => sum + parseFloat(r.value), 0)
    return { ...g, items, subtotal }
  }).filter((g) => g.items.length > 0)

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-6 py-6">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">
            Produção <span className="text-gradient">pessoal</span>
          </h1>
          <p className="mt-1 text-[13px] text-slate-500">Registre serviços e acompanhe a produção do mês.</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" /> Nova produção
        </Button>
      </div>

      <div className="anim-fade-up grid grid-cols-2 gap-4 sm:max-w-2xl">
        <Card>
          <CardBody>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Produção do mês</p>
            <p className="mt-1 text-xl font-bold text-emerald-400">{formatCurrency(totalValue)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Serviços registrados</p>
            <p className="mt-1 text-xl font-bold text-sky-400">{totalCount}</p>
          </CardBody>
        </Card>
      </div>

      <div className="anim-fade-up flex flex-wrap items-center gap-3">
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
      </div>

      <div className="anim-fade-up stagger space-y-4">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-600">Carregando...</p>
        ) : rows.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="inbox"
                title="Nenhuma produção neste mês"
                description="Registre sua primeira produção."
                action={
                  <Button onClick={() => setShowNew(true)}>
                    <Plus className="h-4 w-4" /> Nova produção
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : (
          grouped.map((g) => (
            <div key={g.key} className="overflow-hidden rounded-2xl border border-[#16213a] bg-[#0a1120]/60">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1c2942] bg-[#0e1626] px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-400">{g.label}</p>
                <p className="text-[11px] text-slate-500">
                  {g.items.length} {g.items.length === 1 ? "serviço" : "serviços"} ·{" "}
                  <span className="font-semibold text-emerald-400">{formatCurrency(g.subtotal)}</span>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[#16213a] text-[10px] uppercase tracking-wider text-slate-600">
                      <th className="whitespace-nowrap px-4 py-1.5 text-left font-semibold">Data</th>
                      <th className="whitespace-nowrap px-4 py-1.5 text-left font-semibold">Serviço</th>
                      <th className="whitespace-nowrap px-4 py-1.5 text-left font-semibold">Paciente</th>
                      <th className="whitespace-nowrap px-4 py-1.5 text-left font-semibold">Clínica</th>
                      <th className="whitespace-nowrap px-4 py-1.5 text-right font-semibold">Valor</th>
                      <th className="whitespace-nowrap px-4 py-1.5 text-left font-semibold">Status</th>
                      <th className="px-4 py-1.5" aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((r) => (
                      <tr key={r.id} className="border-b border-[#131d33] transition last:border-0 hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-4 py-1.5">
                          <p className="text-[12px] font-semibold text-slate-200">{formatDate(r.date)}</p>
                          <p className="text-[10px] text-slate-600">{r.code ?? ""}</p>
                        </td>
                        <td className="px-4 py-1.5">
                          <p className="truncate text-[12px] font-semibold text-slate-100">{r.serviceName}</p>
                          <p className="text-[10px] text-slate-500">{TYPE_LABEL[r.serviceType] ?? r.serviceType}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-1.5 text-[11px] text-slate-400">{r.patientName ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-1.5 text-[11px] text-slate-400">{r.category?.name ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-1.5 text-right text-[12px] font-bold text-emerald-400">
                          {formatCurrency(r.value)}
                        </td>
                        <td className="px-4 py-1.5">
                          <Badge tone={r.status === "DONE" ? "success" : r.status === "PENDING" ? "warning" : "danger"}>
                            {r.status === "DONE" ? "Concluído" : r.status === "PENDING" ? "Pendente" : "Cancelado"}
                          </Badge>
                        </td>
                        <td className="px-4 py-1.5 text-right">
                          <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => setRemoving(r)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Registrar produção">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Data">
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Serviço" required>
              <Select value={form.serviceChoice} onChange={(e) => pickService(e.target.value)}>
                <option value="">Selecione o exame...</option>
                {SERVICE_EXAMS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="OUTRO">Outro serviço</option>
              </Select>
              {form.serviceChoice === "OUTRO" && (
                <Input
                  value={form.serviceName}
                  onChange={(e) => set("serviceName", e.target.value)}
                  placeholder="Ex.: Tomografia panorâmica"
                  className="mt-2"
                />
              )}
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select value={form.serviceType} onChange={(e) => pickType(e.target.value)}>
                <option value="">Selecione o tipo...</option>
                <option value="FERNANDO">Fernando</option>
                <option value="BERNARDO">Bernardo</option>
              </Select>
            </Field>
            <Field label="Categoria">
              <Select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                disabled={!form.serviceType}
              >
                <option value="">{form.serviceType ? "Sem categoria" : "Escolha um tipo primeiro..."}</option>
                {clinicOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Paciente">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar paciente (opcional)..." className="pl-9" />
            </div>
            {query && filtered.length > 0 && (
              <div className="mt-2 space-y-1">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(p)
                      setQuery(p.fullName)
                      set("patientName", p.fullName)
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-[#1c2942] bg-[#0a1120] px-3 py-2 text-left text-sm text-slate-300 transition hover:border-sky-700/50"
                  >
                    <span>{p.fullName}</span>
                  </button>
                ))}
              </div>
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor (R$)" required>
              <Input
                type="text"
                inputMode="decimal"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="DONE">Concluído</option>
                <option value="PENDING">Pendente</option>
                <option value="CANCELLED">Cancelado</option>
              </Select>
            </Field>
          </div>
          <Field label="Observações">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={saving}>
              <TrendingUp className="h-4 w-4" /> {saving ? "Salvando..." : "Registrar produção"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Excluir produção"
        message={`Deseja excluir "${removing?.serviceName}" no valor de ${formatCurrency(removing?.value)}?`}
        confirmLabel={saving ? "Excluindo..." : "Excluir produção"}
        danger
      />
    </div>
  )
}