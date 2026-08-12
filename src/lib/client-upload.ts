export type UploadResult = { ok: boolean; status: number; data?: Record<string, unknown>; error?: string }

const CHUNK_SIZE = 4 * 1024 * 1024

export const CLIENT_MAX_UPLOAD = 25 * 1024 * 1024

function uploadErrorMessage(e: unknown) {
  if (e instanceof Error && /abort/i.test(e.message)) return "Upload cancelado."
  return "Sem conexão com o servidor. Verifique sua internet e tente novamente."
}

/**
 * Envia um arquivo via multipart com upload em partes quando necessário
 * (arquivos grandes quebram o limite de corpo das funções do Netlify).
 * Nunca lança exceção: devolve um resultado com erro amigável — inclusive
 * quando a resposta do servidor não é JSON (ex.: 413/HTML de proxy/CDN).
 */
export async function uploadWithChunks(
  path: string,
  file: File,
  getFields: () => Record<string, string>,
  opts?: { onProgress?: (loaded: number, total: number) => void }
): Promise<UploadResult> {
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
  const uploadId = crypto.randomUUID()
  try {
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const fd = new FormData()
      fd.append("chunk", file.slice(start, start + CHUNK_SIZE), file.name)
      fd.append("uploadId", uploadId)
      fd.append("chunkIndex", String(i))
      fd.append("totalChunks", String(totalChunks))
      for (const [key, value] of Object.entries(getFields())) {
        if (value) fd.append(key, value)
      }

      let res: Response
      try {
        res = await fetch(path, { method: "POST", body: fd })
      } catch (e) {
        return { ok: false, status: 0, error: uploadErrorMessage(e) }
      }

      const text = await res.text().catch(() => "")
      let data: Record<string, unknown> | null = null
      try {
        data = JSON.parse(text) as Record<string, unknown>
      } catch {
        data = null
      }

      const loaded = Math.min(i < totalChunks - 1 ? start + CHUNK_SIZE : file.size, file.size)
      opts?.onProgress?.(loaded, file.size)

      if (!res.ok) {
        const serverError = data && typeof data.error === "string" ? data.error : null
        return {
          ok: false,
          status: res.status,
          error: serverError ?? (res.status >= 500 ? "Erro interno do servidor. Tente novamente." : `Falha no envio (HTTP ${res.status}).`),
        }
      }
      if (i < totalChunks - 1) continue
      return { ok: true, status: res.status, data: data ?? {} }
    }
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message || "Erro inesperado no upload." }
  }
  return { ok: false, status: 0, error: "Erro inesperado no upload." }
}

export function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return ""
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1).replace(".", ",")} ${units[i]}`
}