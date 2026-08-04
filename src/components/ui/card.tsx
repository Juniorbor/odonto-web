import { cn } from "@/lib/utils"

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-[#182540] px-5 py-4", className)}>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode
  tone?: "neutral" | "success" | "danger" | "warning" | "info" | "primary" | "violet"
  className?: string
}) {
  const tones = {
    neutral: "bg-slate-500/10 text-slate-300 border-slate-500/30",
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    danger: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    info: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    primary: "bg-sky-500/15 text-sky-200 border-sky-500/40",
    violet: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function StatusDot({ tone = "neutral" }: { tone?: "neutral" | "success" | "danger" | "warning" | "info" }) {
  const tones = {
    neutral: "bg-slate-400",
    success: "bg-emerald-400",
    danger: "bg-rose-400",
    warning: "bg-amber-400",
    info: "bg-sky-400",
  }
  return <span className={cn("inline-block h-2 w-2 rounded-full", tones[tone])} />
}