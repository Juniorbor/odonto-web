import { useId } from "react"

const TOOTH_PATH =
  "M-8,-5 C-8,-15 -4,-21 0,-21 C4,-21 8,-15 8,-5 C8,3 6.5,10 5,15 C4,18 3,21 1.5,24 L0,27 L-1.5,24 C-3,21 -4,18 -5,15 C-6.5,10 -8,3 -8,-5 Z"

type RadiographProps = {
  className?: string
}

/** Radiografia panorâmica estilizada em SVG (sem dados reais de paciente). */
export function PanoramicRadiograph({ className }: RadiographProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")

  const upperTeeth = Array.from({ length: 16 }, (_, i) => {
    const t = 174 - i * 11.25
    const rad = (t * Math.PI) / 180
    const x = 500 + 372 * Math.cos(rad)
    const y = 300 - 200 * Math.sin(rad)
    const d = (Math.atan2(300 - y, 500 - x) * 180) / Math.PI
    return <path key={i} d={TOOTH_PATH} transform={`translate(${x} ${y}) rotate(${d + 90})`} fill={`url(#teeth-${uid})`} />
  })

  const lowerTeeth = Array.from({ length: 16 }, (_, i) => {
    const t = 186 + i * 11.25
    const rad = (t * Math.PI) / 180
    const x = 500 + 372 * Math.cos(rad)
    const y = 300 - 200 * Math.sin(rad)
    const d = (Math.atan2(300 - y, 500 - x) * 180) / Math.PI
    return <path key={i} d={TOOTH_PATH} transform={`translate(${x} ${y}) rotate(${d - 90})`} fill={`url(#teeth-${uid})`} />
  })

  return (
    <svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={`film-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#16222f" />
          <stop offset="45%" stopColor="#0d1622" />
          <stop offset="100%" stopColor="#0a121c" />
        </linearGradient>
        <linearGradient id={`teeth-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8f2fb" />
          <stop offset="55%" stopColor="#c3d3e4" />
          <stop offset="100%" stopColor="#8fa5bd" />
        </linearGradient>
        <radialGradient id={`focus-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#dbe9f7" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#9db8d4" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#9db8d4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`vignette-${uid}`} cx="50%" cy="50%" r="72%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="72%" stopColor="#000" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <filter id={`soft-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={`soft2-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="24" />
        </filter>
        <filter id={`grain-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
        </filter>
      </defs>

      {/* filme */}
      <rect width="1000" height="560" fill={`url(#film-${uid})`} />

      {/* contorno de tecido mole */}
      <ellipse cx="500" cy="300" rx="430" ry="272" fill="none" stroke="#9fb8d4" strokeOpacity="0.1" strokeWidth="26" filter={`url(#soft-${uid})`} />

      {/* coluna vertebral (centro escuro) */}
      <rect x="452" y="130" width="96" height="440" rx="42" fill="#04070d" opacity="0.6" filter={`url(#soft-${uid})`} />
      <rect x="484" y="150" width="32" height="410" rx="16" fill="#bcd0e4" opacity="0.14" filter={`url(#soft2-${uid})`} />

      {/* cavidade nasal */}
      <ellipse cx="470" cy="128" rx="17" ry="26" fill="#05080f" opacity="0.5" filter={`url(#soft-${uid})`} />
      <ellipse cx="530" cy="128" rx="17" ry="26" fill="#05080f" opacity="0.5" filter={`url(#soft-${uid})`} />

      {/* seios maxilares */}
      <ellipse cx="330" cy="186" rx="56" ry="28" fill="#cfe0f2" opacity="0.18" filter={`url(#soft2-${uid})`} />
      <ellipse cx="670" cy="186" rx="56" ry="28" fill="#cfe0f2" opacity="0.18" filter={`url(#soft2-${uid})`} />
      <ellipse cx="500" cy="150" rx="30" ry="20" fill="#cfe0f2" opacity="0.12" filter={`url(#soft2-${uid})`} />

      {/* ossos maxilar e mandíbula */}
      <path d="M140 292 C 270 150 730 150 860 292" fill="none" stroke="#cfe0f2" strokeOpacity="0.35" strokeWidth="44" strokeLinecap="round" filter={`url(#soft-${uid})`} />
      <path d="M140 308 C 270 460 730 460 860 308" fill="none" stroke="#cfe0f2" strokeOpacity="0.35" strokeWidth="44" strokeLinecap="round" filter={`url(#soft-${uid})`} />
      <path d="M140 292 C 270 150 730 150 860 292" fill="none" stroke="#e6f2ff" strokeOpacity="0.55" strokeWidth="7" strokeLinecap="round" />
      <path d="M140 308 C 270 460 730 460 860 308" fill="none" stroke="#e6f2ff" strokeOpacity="0.55" strokeWidth="7" strokeLinecap="round" />

      {/* côndilos */}
      <circle cx="148" cy="275" r="10" fill="#dfeaf6" opacity="0.5" filter={`url(#soft-${uid})`} />
      <circle cx="852" cy="275" r="10" fill="#dfeaf6" opacity="0.5" filter={`url(#soft-${uid})`} />

      {/* dentes */}
      <g opacity="0.9">{upperTeeth}{lowerTeeth}</g>

      {/* brilho focal central */}
      <ellipse cx="500" cy="300" rx="330" ry="190" fill={`url(#focus-${uid})`} />

      {/* granulação do filme */}
      <rect width="1000" height="560" fill="#dbe6f2" filter={`url(#grain-${uid})`} opacity="0.05" style={{ mixBlendMode: "screen" }} />

      {/* vinheta */}
      <rect width="1000" height="560" fill={`url(#vignette-${uid})`} />
    </svg>
  )
}
