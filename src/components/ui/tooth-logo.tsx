import { cn } from "@/lib/utils"

export function ToothLogo({ className, boxClassName }: { className?: string; boxClassName?: string }) {
  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 shadow-glow",
        boxClassName,
      )}
    >
      <svg viewBox="0 0 200 220" className={cn("h-6 w-6", className)} aria-hidden="true">
        <defs>
          <linearGradient id="toothLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#cfeafd" />
          </linearGradient>
        </defs>
        <path
          d="M100 12
             C 128 12, 152 40, 150 78
             C 148 104, 158 126, 164 150
             C 170 176, 158 202, 138 204
             C 122 206, 116 184, 100 184
             C 84 184, 78 206, 62 204
             C 42 202, 30 176, 36 150
             C 42 126, 52 104, 50 78
             C 48 40, 72 12, 100 12 Z"
          fill="url(#toothLogoGrad)"
        />
        <path
          d="M100 12
             C 128 12, 152 40, 150 78
             C 148 104, 158 126, 164 150
             C 166 162, 160 176, 150 186
             C 132 176, 112 172, 88 176
             C 66 180, 50 170, 40 158
             C 44 128, 48 102, 50 78
             C 48 40, 72 12, 100 12 Z"
          fill="#ffffff"
          fillOpacity="0.35"
        />
      </svg>
    </div>
  )
}