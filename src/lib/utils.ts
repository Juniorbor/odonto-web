import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined) {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? 0))
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(isNaN(n) ? 0 : n)
}

export function formatDate(date: Date | string | null | undefined, withTime = false) {
  if (!date) return "—"
  const d = new Date(date)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d)
}

export function formatMonthYear(date: Date | string) {
  const d = new Date(date)
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d)
}

export function toDateInput(date: Date | string | null | undefined) {
  if (!date) return ""
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function todayInput() {
  return toDateInput(new Date())
}

export function monthKey(date: Date | string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

/** Interpreta data "AAAA-MM-DD" como meia-noite LOCAL (new Date("AAAA-MM-DD") seria UTC). */
export function parseLocalDate(v?: string | null): Date | undefined {
  if (!v) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00`)
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function pluralize(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? singular + "s")
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function formatPhone(value?: string | null) {
  if (!value) return ""
  const d = onlyDigits(value)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return value
}

export function formatCpf(value?: string | null) {
  if (!value) return ""
  const d = onlyDigits(value)
  if (d.length === 11) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  return value
}

export function formatCnpj(value?: string | null) {
  if (!value) return ""
  const d = onlyDigits(value)
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  return value
}

export function dateFromInput(value?: string): Date | null {
  if (!value) return null
  const d = new Date(value + "T12:00:00")
  return isNaN(d.getTime()) ? null : d
}

export function calculateAge(birthDate: Date | string) {
  const d = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return Math.max(0, age)
}

export function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}