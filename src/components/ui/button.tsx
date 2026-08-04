import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success" | "subtle" | "warning"
type ButtonSize = "sm" | "md" | "lg" | "icon"

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap select-none"

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-500 text-white shadow-[0_4px_20px_-4px_rgba(14,165,233,0.5)] hover:bg-sky-400 hover:shadow-[0_6px_26px_-4px_rgba(14,165,233,0.65)] active:scale-[0.98]",
  secondary:
    "bg-[#16213a] text-slate-200 border border-[#23345a] hover:bg-[#1b2947] hover:border-sky-700/60 active:scale-[0.98]",
  ghost: "text-slate-300 hover:bg-white/5 hover:text-white active:scale-[0.98]",
  outline:
    "border border-[#2a3c66] bg-transparent text-slate-200 hover:border-sky-500/70 hover:text-sky-300 active:scale-[0.98]",
  danger: "bg-rose-600/90 text-white hover:bg-rose-500 active:scale-[0.98]",
  success: "bg-emerald-600/90 text-white hover:bg-emerald-500 active:scale-[0.98]",
  warning: "bg-amber-600/90 text-white hover:bg-amber-500 active:scale-[0.98]",
  subtle: "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white active:scale-[0.98]",
}

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9 p-0",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  ),
)
Button.displayName = "Button"

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  external,
}: {
  href: string
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  external?: boolean
}) {
  const linkCls = cn(base, variants[variant], sizes[size], className, "no-underline")
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
        {children}
      </a>
    )
  }
  return (
    <a href={href} className={linkCls}>
      {children}
    </a>
  )
}