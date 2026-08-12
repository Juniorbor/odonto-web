"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Palette, Share2, MessageCircle, FileText, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Field, Textarea } from "@/components/ui/input"
import { Card, CardHeader, CardBody } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"

const KEYS = [
  "appName",
  "logoUrl",
  "faviconUrl",
  "primaryColor",
  "whatsapp",
  "instagram",
  "contactEmail",
  "commercialInfo",
  "privacyPolicy",
  "termsOfUse",
]

export default function AdminSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const v: Record<string, string> = {}
        for (const [k, val] of Object.entries(d.settings ?? {})) v[k] = String(val ?? "")
        setValues(v)
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const payload: Record<string, string> = {}
      for (const k of KEYS) payload[k] = values[k] ?? ""
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast("Configurações salvas.", "success")
      router.refresh()
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar.", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="py-20 text-center text-sm text-slate-500">Carregando...</p>
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8">
      <div className="anim-fade-up">
        <h1 className="text-2xl font-bold text-white">Configurações da plataforma</h1>
        <p className="mt-1 text-sm text-slate-500">Identidade visual e informações comerciais globais.</p>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="Marca e identidade" action={<Palette className="h-4 w-4 text-slate-500" />} />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do sistema">
              <Input value={values.appName ?? ""} onChange={(e) => set("appName", e.target.value)} />
            </Field>
            <Field label="Cor primária">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={values.primaryColor || "#0ea5e9"}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-[#23345a] bg-[#0b1120]"
                />
                <Input value={values.primaryColor ?? ""} onChange={(e) => set("primaryColor", e.target.value)} />
              </div>
            </Field>
            <Field label="URL da logo">
              <Input value={values.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} placeholder="/uploads/logo.png" />
            </Field>
            <Field label="URL do favicon">
              <Input value={values.faviconUrl ?? ""} onChange={(e) => set("faviconUrl", e.target.value)} placeholder="/favicon.ico" />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Contato e redes" action={<Share2 className="h-4 w-4 text-slate-500" />} />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp">
              <Input value={values.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} placeholder="5511999999999" />
            </Field>
            <Field label="Instagram">
              <Input value={values.instagram ?? ""} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/..." />
            </Field>
            <Field label="E-mail comercial">
              <Input value={values.contactEmail ?? ""} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
            <Field label="Informações comerciais">
              <Input value={values.commercialInfo ?? ""} onChange={(e) => set("commercialInfo", e.target.value)} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title="Documentos legais (LGPD)" action={<FileText className="h-4 w-4 text-slate-500" />} />
        <CardBody className="space-y-4">
          <Field label="Política de privacidade">
            <Textarea rows={6} value={values.privacyPolicy ?? ""} onChange={(e) => set("privacyPolicy", e.target.value)} />
          </Field>
          <Field label="Termos de uso">
            <Textarea rows={6} value={values.termsOfUse ?? ""} onChange={(e) => set("termsOfUse", e.target.value)} />
          </Field>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={save} loading={saving}>
          <Info className="h-4 w-4" /> Salvar configurações
        </Button>
      </div>
    </div>
  )
}