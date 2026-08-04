"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HardDriveDownload, RefreshCw, Download, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardBody, Badge } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"
import { formatDate } from "@/lib/utils"

type Backup = {
  id: string
  type: string
  fileName: string
  sizeBytes: string
  status: string
  startedAt: string
  completedAt: string | null
}

export default function AdminBackupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [backups, setBackups] = useState<Backup[]>([])
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch("/api/admin/backup")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setBackups(data.backups ?? [])
    } catch {
      toast("Erro ao carregar backups.", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const runBackup = async (type: "MANUAL" | "AUTO" = "MANUAL") => {
    setRunning(true)
    try {
      const res = await fetch("/api/admin/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Backup gerado com sucesso.", "success")
      await load()
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao gerar backup.", "error")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="anim-fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Backup</h1>
          <p className="mt-1 text-sm text-slate-500">Backups automáticos e manuais com controle de retenção.</p>
        </div>
        <Button onClick={() => runBackup("MANUAL")} loading={running}>
          <HardDriveDownload className="h-4 w-4" /> Gerar backup agora
        </Button>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="Histórico de backups" action={<History className="h-4 w-4 text-slate-500" />} />
        <CardBody>
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Carregando...</p>
          ) : backups.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Nenhum backup gerado ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {backups.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-[#16213a] bg-[#0b1220] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{b.fileName}</p>
                      <p className="text-xs text-slate-500">
                        {b.type === "MANUAL" ? "Manual" : "Automático"} • {formatBytes(b.sizeBytes)} • {formatDate(b.startedAt, true)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={b.status === "DONE" ? "success" : "warning"}>{b.status}</Badge>
                    {b.status === "DONE" && (
                      <a
                        href={`/api/admin/backup/download?id=${b.id}`}
                        className="rounded-lg border border-[#23345a] p-2 text-slate-400 transition hover:text-sky-300"
                        aria-label="Baixar backup"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardBody className="text-sm leading-relaxed text-slate-400">
          <p className="font-semibold text-slate-200">Como funciona</p>
          <p className="mt-2">
            Os backups exportam o banco de dados relacional da plataforma em formato SQL e podem
            ser baixados a qualquer momento pelo administrador. Em produção, o backup automático
            deve ser agendado via cron/agendador do servidor.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

function formatBytes(bytes: string) {
  const n = Number(bytes)
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}