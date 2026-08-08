"use client"

import { cn } from "@/lib/utils"

// Modelo replicado do odontograma do OnDoctor (canvas engine original
// de Bardur Thomsen, EPL v1.0): duas fileiras retas de dentes, cada
// dente uma imagem PNG realista (30x90), número do dente com cantoneira,
// checkboxes de superfície (M/D/V/L/O) e marcas vetoriais de condição.

export type OdontoCondition = {
  id: string
  toothNumber: number
  surface: string
  condition: string
  shape?: string | null
  color?: string | null
  note?: string | null
}

// cores do engine original
const COLOR_RED = "#ff0000"
const COLOR_BLUE = "#0052ff"

// cores-padrão por lesão (usadas quando a marca não tem cor explícita)
export const CONDITION_HEX: Record<string, string> = {
  CARIE: "#f59e0b",
  OBTURADO: "#10b981",
  COROA: "#0ea5e9",
  EXTRAIDO: "#f43f5e",
  FRATURADO: "#f97316",
  RAIZ: "#8b5cf6",
  IMPLANTE: "#06b6d4",
  SAUDAVEL: "#22c55e",
}

export const SHAPE_LABELS: Record<string, string> = {
  NONE: "Nenhuma",
  X: "X (Ausente)",
  DOT: "Ponto (Cárie)",
}

const IMG_W = 40 // slot do dente (imgWidth)
const IMG_H = 90 // slot do dente (imgHeight)
const SEPARATOR = 210
const PADDING = 0 // TOOTH_PADDING
const RECT_DIMEN = 10 // tamanho dos checkboxes

const VIEW_W = 16 * IMG_W + 40
const BASE = 20
const VIEW_H = 350

export const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
export const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

const upperX = (n: number) => 20 + UPPER.indexOf(n) * (IMG_W + PADDING)
const lowerX = (n: number) => 20 + LOWER.indexOf(n) * (IMG_W + PADDING)

// dentes com 5 superfícies (pré-molares e molares); os demais têm 4
function has5Surfaces(n: number): boolean {
  const u = n % 10
  return u === 4 || u === 5 || u === 6 || u === 7 || u === 8
}

type CheckBox = { key: string; x: number; y: number; surface: string }

// posições dos checkboxes seguindo create4Surfaces/create5Surfaces
function buildCheckBoxes(n: number, superior: boolean): CheckBox[] {
  const x = superior ? upperX(n) : lowerX(n)
  const y = superior ? BASE : BASE + SEPARATOR
  const boxes: CheckBox[] = []
  const is5 = has5Surfaces(n)
  // mesial/distal conforme o quadrante (correção "Adelcio" do original)
  let rect1Surf: string
  let rect3Surf: string
  if (superior) {
    rect1Surf = n <= 13 ? "D" : "M" // 11-13 => D; 14-18 => D; 21-28 => M
    if (n >= 14 && n <= 18) rect1Surf = "D"
    else if (n >= 24 && n <= 28) rect1Surf = "M"
    rect3Surf = rect1Surf === "D" ? "M" : "D"
  } else {
    if (n >= 41 && n <= 43) rect1Surf = "D"
    else if (n >= 31 && n <= 33) rect1Surf = "M"
    else if (n >= 44 && n <= 48) rect1Surf = "D"
    else rect1Surf = "M"
    rect3Surf = rect1Surf === "D" ? "M" : "D"
  }

  if (is5) {
    const startX = x + 5
    const rowY = superior ? y + IMG_H + RECT_DIMEN : y - RECT_DIMEN * 2
    boxes.push({ key: `${n}_${rect1Surf}`, x: startX, y: rowY, surface: rect1Surf })
    boxes.push({ key: `${n}_O`, x: startX + RECT_DIMEN, y: rowY, surface: "O" })
    boxes.push({ key: `${n}_${rect3Surf}`, x: startX + RECT_DIMEN * 2, y: rowY, surface: rect3Surf })
    boxes.push({
      key: `${n}_V`,
      x: startX + RECT_DIMEN,
      y: superior ? y + IMG_H : y - RECT_DIMEN,
      surface: "V",
    })
    boxes.push({
      key: `${n}_L`,
      x: startX + RECT_DIMEN,
      y: superior ? y + IMG_H + RECT_DIMEN * 2 : y - RECT_DIMEN,
      surface: "L",
    })
  } else {
    const startX = x + 10
    const rowY = superior ? y + IMG_H + RECT_DIMEN : y - RECT_DIMEN * 2
    boxes.push({ key: `${n}_${rect1Surf}`, x: startX, y: rowY, surface: rect1Surf })
    boxes.push({ key: `${n}_${rect3Surf}`, x: startX + RECT_DIMEN, y: rowY, surface: rect3Surf })
    boxes.push({
      key: `${n}_V`,
      x: startX + 5,
      y: superior ? y + IMG_H : y - RECT_DIMEN * 3,
      surface: "V",
    })
    boxes.push({
      key: `${n}_L`,
      x: startX + 5,
      y: superior ? y + IMG_H + RECT_DIMEN * 2 : y - RECT_DIMEN,
      surface: "L",
    })
  }
  return boxes
}

function OdontogramTooth({
  n,
  superior,
  condition,
  surface,
  shape,
  color,
  selected,
  onSelect,
}: {
  n: number
  superior: boolean
  condition?: string
  surface?: string
  shape?: string | null
  color?: string | null
  selected?: boolean
  onSelect?: (n: number) => void
}) {
  const x = superior ? upperX(n) : lowerX(n)
  const y = superior ? BASE : BASE + SEPARATOR
  const imgX = x + IMG_W / 2 - 15 // imagem tem 30px de largura, centralizada
  const imgY = superior ? y - 10 : y + 10

  const shapeColor =
    color || (shape === "X" ? "#e11d48" : shape === "DOT" && condition ? CONDITION_HEX[condition] : undefined) || COLOR_BLUE

  const boxes = buildCheckBoxes(n, superior)
  const boxesWithState = boxes.map((b) => {
    let state = 0
    if (condition === "CARIE" || condition === "OBTURADO") {
      const match = surface === "WHOLE" || surface === b.surface || (surface === "P" && b.surface === "L")
      if (match) state = condition === "CARIE" ? 1 : 11
    }
    return { ...b, state }
  })

  const space = 40
  const idY = superior ? y + IMG_H + space + 10 : y - space - 5
  const borderY = superior ? y + IMG_H + space + 20 : y - space - 20

  return (
    <g onClick={() => onSelect?.(n)} cursor="pointer">
      <title>{`Dente ${n}${condition ? ` · ${condition}${surface && surface !== "WHOLE" ? ` (${surface})` : ""}` : ""}${shape && shape !== "NONE" ? ` · ${SHAPE_LABELS[shape] ?? shape}` : ""}`}</title>

      {/* imagem do dente */}
      <image
        href={`/odontograma/adulto/normal/dente-${n}.png`}
        x={imgX}
        y={imgY}
        width="30"
        height="90"
        className="odontogram-tooth-img"
      />

      {/* marca de dente extraído: X azul sobre o dente (omitido quando a marca "X" já é usada) */}
      {condition === "EXTRAIDO" && shape !== "X" && (
        <g stroke={COLOR_BLUE} strokeWidth="2" strokeLinecap="round">
          {superior ? (
            <>
              <line x1={x} y1={y + IMG_H} x2={x + IMG_W} y2={y + IMG_H * 0.25} />
              <line x1={x + IMG_W} y1={y + IMG_H} x2={x} y2={y + IMG_H * 0.25} />
            </>
          ) : (
            <>
              <line x1={x} y1={y} x2={x + IMG_W} y2={y + IMG_H * 0.75} />
              <line x1={x + IMG_W} y1={y} x2={x} y2={y + IMG_H * 0.75} />
            </>
          )}
        </g>
      )}

      {/* marca de fratura: linha vermelha diagonal */}
      {condition === "FRATURADO" && (
        <line
          x1={x}
          y1={superior ? y + IMG_H : y}
          x2={x + IMG_W}
          y2={y + IMG_H / 2}
          stroke={COLOR_RED}
          strokeWidth="2"
        />
      )}

      {/* marca de coroa: elipse azul no terço coronário */}
      {(condition === "COROA" || condition === "IMPLANTE") && (
        <ellipse
          cx={x + IMG_W / 2}
          cy={superior ? y + 16 : y + IMG_H - 16}
          rx={(RECT_DIMEN * 3) / 2}
          ry={(RECT_DIMEN * 3) / 2}
          fill="none"
          stroke={COLOR_BLUE}
          strokeWidth="2"
        />
      )}

      {/* marca de implante: retângulo + pino azul */}
      {condition === "IMPLANTE" && (
        <g stroke={COLOR_BLUE} strokeWidth="2" fill="none">
          <rect x={x + 13} y={superior ? y + IMG_H - 40 : y + 13} width="14" height="14" />
          <line
            x1={x + IMG_W / 2}
            y1={superior ? y + IMG_H - 40 : y + 27}
            x2={x + IMG_W / 2}
            y2={superior ? y + IMG_H - 40 - 50 : y + 27 + 50}
          />
        </g>
      )}

      {/* marca de raiz: "RR" vermelho */}
      {condition === "RAIZ" && (
        <text
          x={x + IMG_W / 2}
          y={y + IMG_H / 2}
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill={COLOR_RED}
        >
          RR
        </text>
      )}

      {/* marca gráfica por forma (procedimento): X para ausente, ponto para cárie */}
      {shape && shape !== "NONE" && (
        <>
          {shape === "X" && (
            <g stroke={shapeColor} strokeWidth="4" strokeLinecap="round">
              <line x1={x + IMG_W * 0.25} y1={superior ? y + IMG_H * 0.2 : y + IMG_H * 0.15} x2={x + IMG_W * 0.75} y2={superior ? y + IMG_H * 0.8 : y + IMG_H * 0.85} />
              <line x1={x + IMG_W * 0.75} y1={superior ? y + IMG_H * 0.2 : y + IMG_H * 0.15} x2={x + IMG_W * 0.25} y2={superior ? y + IMG_H * 0.8 : y + IMG_H * 0.85} />
            </g>
          )}
          {shape === "DOT" && (
            <g>
              <circle cx={x + IMG_W / 2} cy={y + IMG_H / 2} r="9" fill={shapeColor} opacity="0.25" />
              <circle cx={x + IMG_W / 2} cy={y + IMG_H / 2} r="5" fill={shapeColor} />
            </g>
          )}
        </>
      )}

      {/* checkboxes de superfície */}
      {boxesWithState.map((b) => (
        <rect
          key={b.key}
          x={b.x}
          y={b.y}
          width={RECT_DIMEN}
          height={RECT_DIMEN}
          fill={b.state === 1 ? COLOR_RED : b.state === 11 ? COLOR_BLUE : "transparent"}
          stroke={b.state === 0 ? "rgba(100,116,139,0.6)" : "#000000"}
          strokeWidth="1"
        />
      ))}

      {/* número do dente com cantoneira */}
      <text
        x={x + IMG_W / 2}
        y={idY}
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill="#0f172a"
      >
        {n}
      </text>
      <path
        d={`M ${x} ${borderY} L ${x + IMG_W} ${borderY} L ${x + IMG_W} ${superior ? borderY - RECT_DIMEN * 2 : borderY + RECT_DIMEN * 2}`}
        stroke="#0f172a"
        strokeWidth="1"
        fill="none"
      />

      {/* destaque de seleção */}
      {selected && (
        <rect
          x={x - 3}
          y={imgY - 3}
          width={IMG_W + 6}
          height={IMG_H + 6}
          fill="#00AEFF"
          opacity="0.3"
          rx="4"
        />
      )}
    </g>
  )
}

export function OdontogramArch({
  conditions,
  selectedTooth,
  onSelect,
}: {
  conditions: OdontoCondition[]
  selectedTooth?: number | null
  onSelect?: (n: number) => void
}) {
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-auto w-full select-none">
      {UPPER.map((n) => {
        const cond = conditions.find((c) => c.toothNumber === n)
        return (
          <OdontogramTooth
            key={n}
            n={n}
            superior
            condition={cond?.condition}
            surface={cond?.surface}
            shape={cond?.shape}
            color={cond?.color}
            selected={selectedTooth === n}
            onSelect={onSelect}
          />
        )
      })}
      {LOWER.map((n) => {
        const cond = conditions.find((c) => c.toothNumber === n)
        return (
          <OdontogramTooth
            key={n}
            n={n}
            superior={false}
            condition={cond?.condition}
            surface={cond?.surface}
            shape={cond?.shape}
            color={cond?.color}
            selected={selectedTooth === n}
            onSelect={onSelect}
          />
        )
      })}
    </svg>
  )
}

export { cn }
