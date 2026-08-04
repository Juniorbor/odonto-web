"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, BellRing } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  link?: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          setItems(data.items ?? [])
          setUnread(data.unread ?? 0)
        }
      } catch {
        // servidor indisponível: mantém o estado atual e tenta de novo no próximo poll
      }
    }
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [])

  const markAll = async () => {
    try {
      await fetch("/api/notifications", { method: "POST", body: JSON.stringify({ all: true }) })
    } catch {
      // ignore falha de rede
    }
    setUnread(0)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-xl border border-[#1c2942] bg-[#0a1120] p-2.5 text-slate-400 transition hover:border-sky-700/50 hover:text-sky-300"
        aria-label="Notificações"
      >
        {unread > 0 ? <BellRing className="h-4 w-4 text-sky-400" /> : <Bell className="h-4 w-4" />}
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white shadow-glow">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="anim-scale-in absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-[#22335a] bg-[#0c1322] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1c2942] px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">Notificações</p>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs font-medium text-sky-400 hover:text-sky-300">
                  Marcar todas como lidas
                </button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {items.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-slate-500">Nenhuma notificação.</p>
              )}
              {items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block border-b border-[#131d33] px-4 py-3 transition hover:bg-white/[0.03]",
                    !n.read && "bg-sky-500/[0.06]",
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.read ? "bg-slate-600" : "bg-sky-400",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-200">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-slate-500">{n.message}</p>
                      <p className="mt-1 text-[10px] text-slate-600">{formatDate(n.createdAt, true)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}