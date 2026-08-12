"use client"

import { useState } from "react"
import { Bot, Loader2, Send, Sparkles, UserRound } from "lucide-react"
import { Card, CardBody } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, Select, Textarea } from "@/components/ui/input"
import { useToast } from "@/components/ui/toaster"

type AiPatient = { id: string; fullName: string }

type ChatMsg = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Resuma as últimas evoluções de um paciente",
  "Sugira um plano de tratamento para cárie profunda",
  "Quais são os cuidados pós-extração?",
  "Como explicar o uso de fio dental ao paciente?",
]

export function AiPage({ patients, defaultPatientId }: { patients: AiPatient[]; defaultPatientId?: string }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [patientId, setPatientId] = useState(defaultPatientId ?? "")
  const [loading, setLoading] = useState(false)

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput("")
    setMessages((m) => [...m, { role: "user", content: msg }])
    setLoading(true)
    try {
      const res = await fetch("/api/app/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, patientId: patientId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao consultar.")
      setMessages((m) => [...m, { role: "assistant", content: data.response }])
    } catch (e) {
      toast((e as Error).message, "error")
      setMessages((m) => m.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">
          Assistente <span className="text-gradient">IA</span>
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tire dúvidas clínicas, gere resumos de evoluções e orientações ao paciente.
        </p>
      </div>

      <Card className="anim-fade-up">
        <CardBody>
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="h-4 w-4 text-sky-400" />
            Opcional: selecione um paciente para dar contexto à pergunta.
          </div>
          <Field label="Paciente (contexto)">
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Sem paciente selecionado</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </Select>
          </Field>
        </CardBody>
      </Card>

      <div className="anim-fade-up stagger space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500">Sugestões:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full rounded-xl border border-[#1c2942] bg-[#0a1120] px-4 py-3 text-left text-sm text-slate-400 transition hover:border-sky-700/50 hover:text-sky-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-sky-500">
                <Bot className="h-4 w-4 text-white" />
              </span>
            )}
            <div
              className={`max-w-[80%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "border-sky-500/30 bg-sky-500/10 text-slate-100"
                  : "border-[#1c2942] bg-[#0a1120] text-slate-300"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
            {m.role === "user" && (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500">
                <UserRound className="h-4 w-4 text-white" />
              </span>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-sky-400" /> Pensando...
          </div>
        )}
      </div>

      <div className="anim-fade-up flex items-center gap-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={2}
          placeholder="Pergunte sobre diagnósticos, tratamentos, orientações..."
          className="flex-1"
        />
        <Button onClick={() => send()} disabled={loading || !input.trim()} className="h-auto px-4 py-3">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}