import { SearchX, Inbox, FileQuestion } from "lucide-react"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className,
}: {
  icon?: "inbox" | "search" | "file"
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  const icons = {
    inbox: <Inbox className="h-10 w-10 text-slate-600" />,
    search: <SearchX className="h-10 w-10 text-slate-600" />,
    file: <FileQuestion className="h-10 w-10 text-slate-600" />,
  }
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-14 text-center", className)}>
      <div className="rounded-2xl border border-[#1c2942] bg-[#0a1120] p-5">{icons[icon]}</div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      {description && <p className="max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500/20 border-t-sky-400" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}