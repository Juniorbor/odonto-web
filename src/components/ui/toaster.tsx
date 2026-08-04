"use client"

import { createContext, useCallback, useContext, useRef, useState, useEffect } from "react"
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info" | "warning"

type Toast = {
  id: number
  type: ToastType
  message: string
}

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  error: <XCircle className="h-5 w-5 text-rose-400" />,
  info: <Info className="h-5 w-5 text-sky-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = ++counter.current
      setToasts((prev) => [...prev.slice(-4), { id, type, message }])
      setTimeout(() => remove(id), 4200)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "anim-scale-in pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl",
              t.type === "success" && "border-emerald-500/30 bg-[#0b1a12]/95 backdrop-blur",
              t.type === "error" && "border-rose-500/30 bg-[#1c0b12]/95 backdrop-blur",
              t.type === "info" && "border-sky-500/30 bg-[#0a1420]/95 backdrop-blur",
              t.type === "warning" && "border-amber-500/30 bg-[#1a1508]/95 backdrop-blur",
            )}
          >
            <div className="mt-0.5 shrink-0">{ICONS[t.type]}</div>
            <p className="flex-1 text-sm leading-snug text-slate-200">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="shrink-0 rounded p-0.5 text-slate-500 transition hover:text-slate-200"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function Toaster() {
  return null
}
