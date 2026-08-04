import * as React from "react"
import { cn } from "@/lib/utils"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-[#22335470] bg-[#0b1120] px-3.5 text-sm text-slate-100 placeholder:text-slate-500",
        "transition-all focus:border-sky-500/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-[#23345a70] bg-[#0b1120] px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600",
        "transition-all focus:border-sky-500/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20",
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = "Textarea"

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-[#23345a70] bg-[#0b1120] px-3 text-sm text-slate-100",
        "transition-all focus:border-sky-500/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-[#0b1120]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = "Select"

export function Field({
  label,
  children,
  hint,
  required,
  className,
}: {
  label?: string
  children: React.ReactNode
  hint?: string
  required?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
          {required && <span className="ml-0.5 text-sky-400">*</span>}
        </span>
      )}
      {children}
      {hint && <span className="text-xs text-slate-600">{hint}</span>}
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5"
    >
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-sky-500" : "bg-[#1d2a47]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
      {label && <span className="text-sm text-slate-300">{label}</span>}
    </button>
  )
}