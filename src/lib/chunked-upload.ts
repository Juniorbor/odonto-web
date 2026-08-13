import { saveChunk, assembleChunks, dropChunks, MAX_UPLOAD_SIZE } from "@/lib/storage"

export interface ReceiveChunkResult {
  done: boolean
  waiting?: number
  buffer?: Buffer
  error?: string
  status?: number
}

const UPLOAD_ID_RE = /^[a-zA-Z0-9_-]{8,80}$/

/**
 * Processa um POST de upload com suporte a upload em partes.
 * - Sem partes (upload único): valida o tamanho e devolve o buffer pronto.
 * - Com partes: guarda cada pedaço isolado e, no último, monta o arquivo
 *   completo e remove os pedaços temporários.
 * Isso contorna o limite de corpo (~6MB) das funções do Netlify sem perder o
 * limite final de 25MB.
 */
export async function receiveChunkedUpload(
  tenantId: string,
  form: FormData,
  maxSize = MAX_UPLOAD_SIZE
): Promise<ReceiveChunkResult> {
  const file = form.get("chunk") ?? form.get("file")
  if (!(file instanceof File)) return { done: false, error: "Arquivo obrigatório.", status: 400 }

  const buffer = Buffer.from(await file.arrayBuffer())

  const totalChunks = Math.max(1, Number(String(form.get("totalChunks") || "1")))
  const chunkIndex = Math.max(0, Number(String(form.get("chunkIndex") || "0")))
  const uploadId = String(form.get("uploadId") || "")

  if (totalChunks > 1 && (chunkIndex >= totalChunks || !UPLOAD_ID_RE.test(uploadId))) {
    return { done: false, error: "Sequência de upload inválida.", status: 400 }
  }
  if (buffer.length > maxSize) {
    return {
      done: false,
      error: `Arquivo excede o limite de ${Math.floor(maxSize / 1024 / 1024)}MB.`,
      status: 400,
    }
  }

  if (totalChunks === 1) return { done: true, buffer }

  try {
    await saveChunk(tenantId, uploadId, chunkIndex, buffer)
    if (chunkIndex < totalChunks - 1) return { done: false, waiting: totalChunks }

    const full = await assembleChunks(tenantId, uploadId, totalChunks)
    await dropChunks(tenantId, uploadId, totalChunks)
    if (!full) return { done: false, error: "Erro ao montar o arquivo enviado.", status: 500 }
    if (full.length > maxSize) {
      return {
        done: false,
        error: `Arquivo excede o limite de ${Math.floor(maxSize / 1024 / 1024)}MB.`,
        status: 400,
      }
    }
    return { done: true, buffer: full }
  } catch (e) {
    return { done: false, error: (e as Error).message, status: 500 }
  }
}