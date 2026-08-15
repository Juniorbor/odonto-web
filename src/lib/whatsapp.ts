import "server-only"

const EVOLUTION_URL = (process.env.EVOLUTION_URL || "").replace(/\/+$/, "")
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ""
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || ""

export function whatsappStatus() {
  return {
    evolution: !!(EVOLUTION_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE),
    instance: EVOLUTION_INSTANCE || null,
  }
}

export function normalizePhone(raw: string) {
  const digits = (raw || "").replace(/\D/g, "")
  if (digits.length < 10 || digits.length > 13) return null
  let d = digits
  if (d.length === 10 || d.length === 11) d = `55${d}`
  return d
}

export async function sendWhatsAppText(to: string, text: string) {
  if (!whatsappStatus().evolution) return false
  const number = normalizePhone(to)
  if (!number) return false
  try {
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({ number, text }),
    })
    if (!res.ok) {
      console.error("Evolution API error:", res.status, await res.text())
      return false
    }
    return true
  } catch (e) {
    console.error("Falha ao enviar WhatsApp:", e)
    return false
  }
}
