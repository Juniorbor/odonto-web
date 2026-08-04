export const MODULES = [
  { key: "patients", label: "Pacientes" },
  { key: "anamnesis", label: "Anamnese" },
  { key: "appointments", label: "Atendimento" },
  { key: "agenda", label: "Agenda" },
  { key: "odontogram", label: "Odontograma" },
  { key: "images", label: "Fotografias" },
  { key: "radiographs", label: "Radiografias" },
  { key: "documents", label: "Documentos" },
  { key: "production", label: "Produção Pessoal" },
  { key: "finance", label: "Financeiro" },
  { key: "reports", label: "Relatórios" },
  { key: "ai", label: "Assistente IA" },
] as const

export type ModuleKey = (typeof MODULES)[number]["key"]

export const CONDITION_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "carie", label: "Cárie", color: "#f59e0b" },
  { value: "carie_oclusal", label: "Cárie oclusal", color: "#f59e0b" },
  { value: "carie_proximal", label: "Cárie proximal", color: "#f59e0b" },
  { value: "carie_cervical", label: "Cárie cervical", color: "#f59e0b" },
  { value: "restauracao", label: "Restauração", color: "#22c55e" },
  { value: "restauracao_falha", label: "Restauração com falha", color: "#ef4444" },
  { value: "dente_ausente", label: "Dente ausente", color: "#6b7280" },
  { value: "dente_extraido", label: "Dente extraído", color: "#374151" },
  { value: "fratura", label: "Fratura", color: "#f97316" },
  { value: "trinca", label: "Trinca", color: "#a3e635" },
  { value: "desgaste", label: "Desgaste", color: "#84cc16" },
  { value: "abrasao", label: "Abrasão", color: "#ca8a04" },
  { value: "erosao", label: "Erosão", color: "#eab308" },
  { value: "reabsorcao", label: "Reabsorção", color: "#f43f5e" },
  { value: "mobilidade", label: "Mobilidade", color: "#d946ef" },
  { value: "lesao_furca", label: "Lesão de furca", color: "#a21caf" },
  { value: "endodontia", label: "Tratamento endodôntico", color: "#0ea5e9" },
  { value: "coroa", label: "Coroa", color: "#94a3b8" },
  { value: "faceta", label: "Faceta", color: "#e2e8f0" },
  { value: "implante", label: "Implante", color: "#22d3ee" },
  { value: "pino", label: "Pino", color: "#334155" },
  { value: "protese", label: "Prótese", color: "#cbd5e1" },
  { value: "selante", label: "Selante", color: "#60a5fa" },
  { value: "dente_incluso", label: "Dente incluso", color: "#64748b" },
  { value: "dente_impactado", label: "Dente impactado", color: "#475569" },
  { value: "lesao", label: "Lesão", color: "#e11d48" },
  { value: "periodontal", label: "Alteração periodontal", color: "#fb7185" },
  { value: "outros", label: "Outros", color: "#9ca3af" },
]

export const CONDITION_COLOR: Record<string, string> = Object.fromEntries(
  CONDITION_OPTIONS.map((c) => [c.value, c.color]),
)

export const SURFACES = [
  { value: "M", label: "Mesial" },
  { value: "D", label: "Distal" },
  { value: "V", label: "Vestibular" },
  { value: "L", label: "Lingual/Palatina" },
  { value: "O", label: "Oclusal" },
  { value: "I", label: "Incisal" },
  { value: "C", label: "Cervical" },
  { value: "R", label: "Raiz" },
  { value: "T", label: "Toda a superfície" },
]

export const PERMANENT_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

export type ToothType = "molar" | "premolar" | "canine" | "incisor"

export function toothType(fdi: number): ToothType {
  const q = Math.floor(fdi / 10)
  const seq = fdi % 10
  if (q === 1 || q === 2) {
    if (seq === 1 || seq === 2) return "incisor"
    if (seq === 3) return "canine"
    if (seq === 4 || seq === 5) return "premolar"
    return "molar"
  }
  if (seq === 1 || seq === 2) return "incisor"
  if (seq === 3) return "canine"
  if (seq === 4 || seq === 5) return "premolar"
  return "molar"
}

export function isUpper(fdi: number) {
  return fdi >= 11 && fdi <= 28
}

export function toothName(fdi: number) {
  const upper = isUpper(fdi)
  const seq = fdi % 10
  const t = toothType(fdi)
  const position =
    t === "molar" ? " molar" : t === "premolar" ? " pré-molar" : t === "canine" ? " dente canino" : ""
  const side = seq <= 5 ? " direito" : " esquerdo"
  return `${upper ? "Superior" : "Inferior"}${position}${side}`
}

export const EXTRAORAL_LABELS = [
  "Frente",
  "Perfil direito",
  "Perfil esquerdo",
  "Sorrindo",
  "Repouso",
  "Sorriso frontal",
]

export const INTRAORAL_LABELS = [
  "Frontal",
  "Lateral direita",
  "Lateral esquerda",
  "Oclusal superior",
  "Oclusal inferior",
  "Palato",
  "Língua",
  "Região específica",
  "Outros",
]

export const EXAM_LABELS: Record<string, string> = {
  PANORAMICA: "Panorâmica",
  PERIAPICAL: "Periapical",
  INTERPROXIMAL: "Interproximal",
  OCLUSAL: "Oclusal",
  TOMOGRAFIA: "Tomografia",
  CEFALOMETRIA: "Cefalometria",
  FOTOGRAFIA: "Fotografia",
  OUTRO: "Outros",
}

export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em atendimento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Faltou",
}

export const EXPENSE_STATUS_LABEL: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Vencido",
  SCHEDULED: "Agendado",
}

export const PRODUCTION_STATUS_LABEL: Record<string, string> = {
  DONE: "Concluído",
  PENDING: "Pendente",
  CANCELLED: "Cancelado",
}

export const DEFAULT_PROD_REGIONS = ["Mandíbula", "Maxila", "ATM", "Seios da face", "Órbita", "Toda a boca"]

export const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]