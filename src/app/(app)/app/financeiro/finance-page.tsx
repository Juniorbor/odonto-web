"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowDownCircle, ArrowUpCircle, CheckCircle2, Plus, Trash2, Wallet } from "lucide-react"
import { Card, CardBody, Badge } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/input"
import { Modal, ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { EmptyState } from "@/components/ui/feedback"
import { formatCurrency, formatDate, monthKey } from "@/lib/utils"

type FinCat = { id: string; name: string; type: string }
type FinEntry = {
  id: string
  description: string
  value: string
  date: string
  recurring: boolean
  notes: string | null
  category: { id: string; name: string; type: string } | null
}
type FinExpense = {
  id: string
  name: string
  type: string
  value: string
  dueDate: string
  status: string
  paymentMethod: string | null
  category: { id: string; name: string; type: string } | null
}

const EXPENSE_STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" }> = {
  PAID: { label: "Pago", tone: "success" },
  PENDING: { label: "Pendente", tone: "warning" },
  OVERDUE: { label: "Vencida", tone: "danger" },
  SCHEDULED: { label: "Agendada", tone: "info" },
}

const maskBRL = (raw: string): string => {
  const hasComma = raw.includes(",")
  let s = hasComma ? raw.replace(/\./g, "") : raw.replace(/[^\d,]/g, "")
  const [intPart, decPart = ""] = s.split(",")
  const int = intPart.replace(/\D/g, "").replace(/^0+(?=\d)/, "")
  const intMasked = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  const dec = decPart.replace(/\D/g, "").slice(0, 2)
  return dec || hasComma ? `${intMasked},${dec}` : intMasked
}

const parseBRL = (v: string): number => {
  const n = parseFloat(v.replace(/\./g, "").replace(",", "."))
  return Number.isNaN(n) ? NaN : n
}

export function FinancePage({ categories }: { categories: FinCat[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [month, setMonth] = useState(monthKey(new Date()))
  const [entries, setEntries] = useState<FinEntry[]>([])
  const [expenses, setExpenses] = useState<FinExpense[]>([])
  const [incomeTotal, setIncomeTotal] = useState("0")
  const [expenseTotal, setExpenseTotal] = useState("0")
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [kind, setKind] = useState<"income" | "expense">("income")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<{ id: string; kind: string; label: string } | null>(null)
  const [form, setForm] = useState({
    description: "",
    name: "",
    value: "",
    date: `${month}-01`,
    dueDate: `${month}-01`,
    categoryId: "",
    status: "PENDING",
    type: "VARIAVEL",
    paymentMethod: "",
    notes: "",
  })

  const fetchMonth = useCallback(async (m: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/app/finance?month=${m}`)
      const data = await res.json()
      if (res.ok) {
        setEntries(data.entries)
        setExpenses(data.expenses)
        setIncomeTotal(data.incomeTotal)
        setExpenseTotal(data.expenseTotal)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonth(month)
  }, [month, fetchMonth])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    const name = kind === "income" ? form.description : form.name
    const valueNum = parseBRL(form.value)
    if (!name.trim() || isNaN(valueNum) || valueNum <= 0) {
      toast("Preencha a descrição e o valor.", "error")
      return
    }
    setSaving(true)
    try {
      const body =
        kind === "income"
          ? { kind: "income", description: form.description, value: valueNum, date: form.date, categoryId: form.categoryId, notes: form.notes }
          : { kind: "expense", name: form.name, type: form.type, value: valueNum, dueDate: form.dueDate, status: form.status, paymentMethod: form.paymentMethod, categoryId: form.categoryId, notes: form.notes }
      const res = await fetch("/api/app/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao registrar.")
      toast(kind === "income" ? "Entrada registrada." : "Despesa registrada.", "success")
      setShowNew(false)
      setForm({ description: "", name: "", value: "", date: `${month}-01`, dueDate: `${month}-01`, categoryId: "", status: "PENDING", type: "VARIAVEL", paymentMethod: "", notes: "" })
      fetchMonth(month)
      router.refresh()
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const markPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/app/finance/${id}?kind=expense`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast("Despesa marcada como paga.", "success")
      fetchMonth(month)
    } catch (e) {
      toast((e as Error).message, "error")
    }
  }

  const confirmRemove = async () => {
    if (!removing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/app/finance/${removing.id}?kind=${removing.kind}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro.")
      toast("Excluído.", "success")
      setRemoving(null)
      fetchMonth(month)
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setSaving(false)
    }
  }

  const incomeNum = parseFloat(incomeTotal)
  const expenseNum = parseFloat(expenseTotal)
  const balance = incomeNum - expenseNum

  const incomeCats = categories.filter((c) => c.type === "ENTRADA")
  const expenseCats = categories.filter((c) => c.type !== "ENTRADA")

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Financeiro <span className="text-gradient">da clínica</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Entradas, despesas e saldo do mês.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setKind("income"); setShowNew(true) }}>
            <ArrowDownCircle className="h-4 w-4 text-emerald-400" /> Entrada
          </Button>
          <Button onClick={() => { setKind("expense"); setShowNew(true) }}>
            <Plus className="h-4 w-4" /> Despesa
          </Button>
        </div>
      </div>

      <div className="anim-fade-up grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <ArrowDownCircle className="h-3.5 w-3.5 text-emerald-400" /> Entradas
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-400">{formatCurrency(incomeNum)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <ArrowUpCircle className="h-3.5 w-3.5 text-rose-400" /> Despesas
            </p>
            <p className="mt-1 text-2xl font-bold text-rose-400">{formatCurrency(expenseNum)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Wallet className="h-3.5 w-3.5 text-sky-400" /> Saldo do mês
            </p>
            <p className={`mt-1 text-2xl font-bold ${balance >= 0 ? "text-sky-400" : "text-rose-400"}`}>
              {formatCurrency(balance)}
            </p>
          </CardBody>
        </Card>
      </div>

      <div className="anim-fade-up">
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-600">Carregando...</p>
      ) : entries.length === 0 && expenses.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState icon="inbox" title="Nenhum lançamento no mês" description="Registre entradas e despesas da clínica." />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="anim-fade-up stagger space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-100">Entradas</h3>
            {entries.length === 0 && <p className="text-sm text-slate-600">Nenhuma entrada no mês.</p>}
            {entries.map((e) => (
              <Card key={e.id}>
                <CardBody>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{e.description}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(e.date)} {e.category ? `· ${e.category.name}` : ""} {e.recurring ? "· recorrente" : ""}
                      </p>
                    </div>
                    <p className="text-base font-bold text-emerald-400">{formatCurrency(e.value)}</p>
                    <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => setRemoving({ id: e.id, kind: "entry", label: e.description })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="anim-fade-up stagger space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-100">Despesas</h3>
            {expenses.length === 0 && <p className="text-sm text-slate-600">Nenhuma despesa no mês.</p>}
            {expenses.map((e) => {
              const meta = EXPENSE_STATUS[e.status] ?? { label: e.status, tone: "info" as const }
              return (
                <Card key={e.id}>
                  <CardBody>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">{e.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Venc. {formatDate(e.dueDate)} {e.category ? `· ${e.category.name}` : ""}
                        </p>
                      </div>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <p className="text-base font-bold text-rose-400">{formatCurrency(e.value)}</p>
                      {e.status !== "PAID" && (
                        <Button size="sm" variant="outline" onClick={() => markPaid(e.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pagar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-rose-400 hover:bg-rose-500/10" onClick={() => setRemoving({ id: e.id, kind: "expense", label: e.name })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title={kind === "income" ? "Nova entrada" : "Nova despesa"}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={kind === "income" ? "Descrição" : "Nome da despesa"} required>
              <Input
                value={kind === "income" ? form.description : form.name}
                onChange={(e) => set(kind === "income" ? "description" : "name", e.target.value)}
                placeholder={kind === "income" ? "Ex.: Honorários consulta" : "Ex.: Aluguel"}
              />
            </Field>
            <Field label="Valor (R$)" required>
              <Input type="text" inputMode="decimal" value={form.value} onChange={(e) => set("value", maskBRL(e.target.value))} placeholder="0,00" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={kind === "income" ? "Data" : "Vencimento"} required>
              <Input type="date" value={kind === "income" ? form.date : form.dueDate} onChange={(e) => set(kind === "income" ? "date" : "dueDate", e.target.value)} />
            </Field>
            <Field label="Categoria">
              <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Sem categoria</option>
                {(kind === "income" ? incomeCats : expenseCats).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          {kind === "expense" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo">
                <Select value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="FIXA">Fixa</option>
                  <option value="VARIAVEL">Variável</option>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                  <option value="PENDING">Pendente</option>
                  <option value="SCHEDULED">Agendada</option>
                  <option value="PAID">Paga</option>
                  <option value="OVERDUE">Vencida</option>
                </Select>
              </Field>
            </div>
          )}
          {kind === "expense" && (
            <Field label="Forma de pagamento">
              <Input value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} placeholder="Pix, cartão, boleto..." />
            </Field>
          )}
          <Field label="Observações">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        title="Excluir lançamento"
        message={`Deseja excluir "${removing?.label}"?`}
        confirmLabel={saving ? "Excluindo..." : "Excluir"}
        danger
      />
    </div>
  )
}