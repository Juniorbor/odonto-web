"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"

type PatientItem = {
  id: string
  fullName: string
  phone: string | null
  createdAt: string
  clinic: { name: string } | null
}

const PAGE_SIZE = 10

export function RecentPatients({
  showClinic,
  initialPatients,
  initialTotal,
}: {
  showClinic: boolean
  initialPatients: PatientItem[]
  initialTotal: number
}) {
  const [patients, setPatients] = useState(initialPatients)
  const [total, setTotal] = useState(initialTotal)
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const fetchPage = useCallback(async (term: string, pg: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/app/patients?q=${encodeURIComponent(term)}&page=${pg}&pageSize=${PAGE_SIZE}`)
      const data = await res.json()
      if (res.ok) {
        setPatients(data.patients ?? [])
        setTotal(data.total ?? 0)
      }
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [])

  const onSearch = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      void fetchPage(value.trim(), 1)
    }, 400)
  }

  const goToPage = (pg: number) => {
    setPage(pg)
    void fetchPage(query.trim(), pg)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const end = Math.min(page * PAGE_SIZE, total)

  return (
    <Card className="anim-fade-up">
      <CardBody>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100">Últimos pacientes</h3>
          <Link
            href="/app/pacientes"
            className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <Input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Buscar por nome ou ID do paciente..."
            className="bg-slate-900/60 pl-9"
          />
        </div>

        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[58px] animate-pulse rounded-xl border border-[#16213a] bg-[#0d1526]" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-600">
            {query ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado ainda."}
          </p>
        ) : (
          <div className="space-y-2.5">
            {patients.map((p) => (
              <Link
                key={p.id}
                href={`/app/pacientes/${p.id}`}
                className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3 transition hover:border-sky-700/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{p.fullName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {p.phone || "Sem telefone"}
                    {showClinic && p.clinic ? ` • ${p.clinic.name}` : ""}
                  </p>
                </div>
                <span className="text-[11px] text-slate-600">{formatDate(p.createdAt)}</span>
              </Link>
            ))}
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between border-t border-[#16213a] pt-3">
            <span className="text-[11px] text-slate-600">
              {start}–{end} de {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#16213a] bg-[#0b1220] text-slate-300 transition hover:border-sky-700/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[70px] text-center text-[11px] text-slate-500">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => goToPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#16213a] bg-[#0b1220] text-slate-300 transition hover:border-sky-700/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
