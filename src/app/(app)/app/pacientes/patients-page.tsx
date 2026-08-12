"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { CalendarDays, FileText, Mail, Pencil, Phone, Plus, Search, Stethoscope, Trash2, UserPlus } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/feedback"
import { Button, LinkButton } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/feedback"
import { ConfirmDialog } from "@/components/ui/modal"
import { useToast } from "@/components/ui/toaster"
import { formatDate, formatCpf, calculateAge } from "@/lib/utils"
import { initials } from "@/lib/utils"

type PatientRow = {
  id: string
  photoUrl: string | null
  fullName: string
  socialName: string | null
  cpf: string | null
  birthDate: string | null
  sex: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  active: boolean
  createdAt: string
  _count: { appointments: number; clinicalRecords: number }
}

export function PatientsPage({
  initialPatients,
  initialTotal,
  pageSize,
}: {
  initialPatients: PatientRow[]
  initialTotal: number
  pageSize: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [patients, setPatients] = useState(initialPatients)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<PatientRow | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [q, setQ] = useState(searchParams.get("q") || "")
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const fetchPatients = useCallback(
    async (query: string, page = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page) })
        if (query.trim()) params.set("q", query.trim())
        const res = await fetch(`/api/app/patients?${params.toString()}`)
        const data = await res.json()
        if (res.ok) {
          setPatients(data.patients)
          setTotal(data.total)
        }
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const onSearch = (value: string) => {
    setQ(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPatients(value)
      router.replace(`/app/pacientes${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`, { scroll: false })
    }, 400)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      const res = await fetch(`/api/app/patients/${deleting.id}?hard=1`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao excluir.")
      toast("Paciente excluído permanentemente.", "success")
      setPatients((list) => list.filter((p) => p.id !== deleting.id))
      setTotal((t) => Math.max(0, t - 1))
      setDeleting(null)
    } catch (e) {
      toast((e as Error).message, "error")
    } finally {
      setDeletingBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 sm:space-y-6 px-3.5 py-4 sm:px-6 sm:py-8">
      <div className="anim-fade-up flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Pacientes <span className="text-gradient">({total})</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Cadastro completo e prontuário eletrônico.</p>
        </div>
        <LinkButton href="/app/pacientes/novo">
          <UserPlus className="h-4 w-4" /> Novo paciente
        </LinkButton>
      </div>

      <div className="anim-fade-up flex items-center gap-2 rounded-xl border border-[#1c2942] bg-[#0a1120] px-3.5 py-2.5 sm:max-w-md">
        <Search className="h-4 w-4 shrink-0 text-slate-500" />
        <Input
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por nome, CPF, telefone..."
          className="border-0 bg-transparent p-0 focus:ring-0"
        />
      </div>

      <div className="anim-fade-up stagger space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))
        ) : patients.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon="search"
                title={q ? "Nenhum resultado encontrado" : "Nenhum paciente cadastrado"}
                description={q ? "Tente outro termo de busca." : "Cadastre o primeiro paciente da clínica."}
                action={
                  q ? undefined : (
                    <LinkButton href="/app/pacientes/novo">
                      <Plus className="h-4 w-4" /> Cadastrar paciente
                    </LinkButton>
                  )
                }
              />
            </CardBody>
          </Card>
        ) : (
          patients.map((p) => (
            <Card key={p.id} className="transition hover:-translate-y-0.5">
              <CardBody>
                <div className="flex flex-wrap items-center gap-4">
                  <Link href={`/app/pacientes/${p.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 text-sm font-bold text-white">
                      {initials(p.fullName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-100">{p.fullName}</p>
                        {p.socialName && (
                          <span className="text-xs text-slate-500">({p.socialName})</span>
                        )}
                        {!p.active && (
                          <span className="rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {p.cpf && <span>{formatCpf(p.cpf)}</span>}
                        {p.birthDate && <span>{calculateAge(p.birthDate)} anos</span>}
                        {p.sex && <span>{p.sex === "F" ? "Feminino" : p.sex === "M" ? "Masculino" : p.sex}</span>}
                        {p.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {p.phone}
                          </span>
                        )}
                        {p.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {p.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="hidden items-center gap-4 text-[11px] text-slate-500 md:flex">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" /> {p._count.appointments} atend.
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> {p._count.clinicalRecords} evoluções
                      </span>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <LinkButton href={`/app/pacientes/${p.id}/editar`} variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Editar paciente">
                      <Pencil className="h-3.5 w-3.5" />
                    </LinkButton>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      onClick={() => setDeleting(p)}
                      aria-label="Excluir paciente"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => !deletingBusy && setDeleting(null)}
        onConfirm={confirmDelete}
        title="Excluir paciente"
        message={
          <>
            Tem certeza que deseja <strong>excluir permanentemente</strong> {deleting?.fullName}? Esta ação remove o
            cadastro, prontuário, agendamentos, exames e fotos — <strong>não é possível desfazer</strong>.
          </>
        }
        confirmLabel={deletingBusy ? "Excluindo..." : "Excluir paciente"}
        danger
        loading={deletingBusy}
      />

      {total > pageSize && (
        <div className="anim-fade-up flex items-center justify-between pt-2 text-sm text-slate-500">
          <span>
            Exibindo {patients.length} de {total}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || patients.length === 0 || patients.length < pageSize}
            onClick={() => fetchPatients(q, 2)}
          >
            <Stethoscope className="h-3.5 w-3.5" /> Carregar mais
          </Button>
        </div>
      )}
    </div>
  )
}