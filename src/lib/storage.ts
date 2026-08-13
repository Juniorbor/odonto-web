import "server-only"
import fs from "fs"
import fsp from "fs/promises"
import path from "path"
import crypto from "crypto"
import { getStore } from "@netlify/blobs"

const ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_DIR || "storage")
const USE_BLOBS = process.env.NETLIFY === "true"
const BLOB_STORE = "laudos-files"

let blobStore: ReturnType<typeof getStore> | null = null
let blobInitError: string | null = null

export function blobStatus() {
  return {
    netlify: USE_BLOBS,
    storeReady: blobStore !== null,
    initError: blobInitError,
  }
}

function blobApi() {
  if (blobStore) return blobStore
  if (!USE_BLOBS || blobInitError) return null
  try {
    blobStore = getStore(BLOB_STORE)
    return blobStore
  } catch (e) {
    blobInitError = (e as Error).message
    console.error("Netlify Blobs indisponível:", blobInitError)
    return null
  }
}

class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StorageError"
  }
}

/** Grava um buffer no disco (fallback local). */
async function writeFileToDisk(relativePath: string, buffer: Buffer) {
  const dirPath = path.join(ROOT, path.dirname(relativePath))
  try {
    await fsp.mkdir(dirPath, { recursive: true })
    await fsp.writeFile(path.join(ROOT, relativePath), buffer)
  } catch (e) {
    const reason = (e as Error).message
    throw new StorageError(
      `Armazenamento de arquivos indisponível no servidor (${reason}). ` +
        (USE_BLOBS
          ? "Habilite o Netlify Blobs no painel do site (Netlify → Data storage → Blobs) para salvar arquivos no deploy."
          : "Verifique a permissão de escrita da pasta de arquivos."),
    )
  }
}

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "application/pdf",
  "image/tiff",
  "image/dicom",
])

export const MAX_UPLOAD_SIZE = 25 * 1024 * 1024

export function storageRoot() {
  return ROOT
}

export function relativeToAbsolute(relativePath: string) {
  return path.join(ROOT, relativePath)
}

function safeRelative(...parts: string[]) {
  const candidate = path.join(...parts)
  const normalized = path.normalize(candidate).replace(/^([\\/])+/, "")
  if (normalized.startsWith("..")) {
    throw new Error("Caminho inválido")
  }
  return normalized
}

export async function saveFile(buffer: Buffer, options: { tenantId: string; subdir: string[]; filename?: string; ext?: string }) {
  const safeSubdir = safeRelative(options.tenantId, ...options.subdir)
  const name = options.filename ?? crypto.randomBytes(16).toString("hex")
  const ext = options.ext ? (options.ext.startsWith(".") ? options.ext : `.${options.ext}`) : ""
  const fileName = `${name}${ext}`
  const relativePath = path.join(safeSubdir, fileName).replace(/\\/g, "/")

  if (USE_BLOBS) {
    const store = blobApi()
    if (store) {
      try {
        const buf = new Uint8Array(buffer)
        await store.set(relativePath, buf as unknown as ArrayBuffer)
        return relativePath
      } catch (e) {
        console.error("Blob store indisponível, gravando no disco:", e)
      }
    }
  }

  await writeFileToDisk(relativePath, buffer)

  return relativePath
}

export async function readFileBuffer(relativePath: string) {
  if (USE_BLOBS) {
    const store = blobApi()
    if (store) {
      try {
        const data = (await store.get(relativePath, { type: "arrayBuffer" })) as ArrayBuffer | null
        if (data) return Buffer.from(data)
      } catch {
        // blob indisponível — tenta o disco (fallback)
      }
    }
  }
  const abs = path.join(ROOT, path.normalize(relativePath))
  if (!abs.startsWith(ROOT)) return null
  if (!fs.existsSync(abs)) return null
  try {
    return await fsp.readFile(abs)
  } catch {
    return null
  }
}

export async function removeFile(relativePath?: string | null) {
  if (!relativePath) return
  if (USE_BLOBS) {
    const store = blobApi()
    if (store) {
      try {
        await store.delete(relativePath)
      } catch {
        // blob já não existe ou indisponível
      }
    }
  }
  const abs = path.join(ROOT, path.normalize(relativePath))
  if (!abs.startsWith(ROOT)) return
  try {
    await fsp.unlink(abs)
  } catch {
    // arquivo já não existe
  }
}

export function fileExtensionFromMime(mime: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/dicom": "dcm",
  }
  return map[mime] || "bin"
}

export function detectMimeSignature(buffer: Buffer, declaredMime?: string) {
  if (!buffer || buffer.length < 12) return declaredMime || null
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg"
  if (buffer[0] === 0x89 && buffer.toString("ascii", 1, 4) === "PNG") return "image/png"
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp"
  if (buffer.toString("ascii", 0, 6) === "GIF87a" || buffer.toString("ascii", 0, 6) === "GIF89a")
    return "image/gif"
  if (buffer.toString("ascii", 0, 2) === "BM") return "image/bmp"
  if (buffer.toString("ascii", 0, 4) === "II*\u0000" || buffer.toString("ascii", 0, 4) === "MM\u0000*")
    return "image/tiff"
  // DICOM: o magic "DICM" fica no offset 128 (128 bytes de cabeçalho); aceita também no offset 0
  if (
    buffer.toString("ascii", 0, 4) === "DICM" ||
    (buffer.length > 132 && buffer.toString("ascii", 128, 132) === "DICM")
  )
    return "image/dicom"
  if (buffer.toString("ascii", 0, 5) === "%PDF-") return "application/pdf"
  const declared = declaredMime && ALLOWED_IMAGE_TYPES.has(declaredMime) ? declaredMime : null
  return declared
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  dcm: "image/dicom",
  pdf: "application/pdf",
}

/**
 * Resolve o MIME de um upload de forma tolerante: primeiro pela assinatura
 * (magic bytes), depois pelo tipo declarado pelo navegador, e por último pela
 * extensão do arquivo. Navegadores enviam type vazio ou "application/octet-stream"
 * para DICOM/TIFF, o que derrubava uploads válidos de radiografias.
 */
export function resolveUploadMime(filename: string, declaredType: string, buffer: Buffer): string | null {
  const detected = detectMimeSignature(buffer, declaredType)
  if (detected) return ALLOWED_IMAGE_TYPES.has(detected) ? detected : null
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  const fromExt = EXT_TO_MIME[ext]
  return fromExt && ALLOWED_IMAGE_TYPES.has(fromExt) ? fromExt : null
}

const CHUNK_SUBDIR = "_chunks"

/**
 * Upload em partes: cada pedaço é guardado isolado (blob ou disco) e só é
 * montado no último. Necessário para contornar o limite de corpo das funções
 * do Netlify (~6MB), mantendo arquivos de até 25MB.
 */
export async function saveChunk(tenantId: string, uploadId: string, index: number, buffer: Buffer) {
  const rel = safeRelative(CHUNK_SUBDIR, tenantId, uploadId, `${index}.part`)
  if (USE_BLOBS) {
    const store = blobApi()
    if (store) {
      try {
        await store.set(rel, new Uint8Array(buffer) as unknown as ArrayBuffer)
        return
      } catch (e) {
        console.error("Blob store indisponível para chunk, gravando no disco:", e)
      }
    }
  }
  await writeFileToDisk(rel, buffer)
}

export async function assembleChunks(tenantId: string, uploadId: string, total: number): Promise<Buffer | null> {
  const parts: Buffer[] = []
  for (let i = 0; i < total; i++) {
    const rel = safeRelative(CHUNK_SUBDIR, tenantId, uploadId, `${i}.part`)
    if (USE_BLOBS) {
      const store = blobApi()
      if (store) {
        try {
          const data = (await store.get(rel, { type: "arrayBuffer" })) as ArrayBuffer | null
          if (!data) return null
          parts.push(Buffer.from(data))
          continue
        } catch {
          return null
        }
      }
    }
    const abs = path.join(ROOT, rel)
    if (!fs.existsSync(abs)) return null
    parts.push(await fsp.readFile(abs))
  }
  return Buffer.concat(parts)
}

export async function dropChunks(tenantId: string, uploadId: string, total: number) {
  if (total <= 0) return
  for (let i = 0; i < total; i++) {
    const rel = safeRelative(CHUNK_SUBDIR, tenantId, uploadId, `${i}.part`)
    if (USE_BLOBS) {
      const store = blobApi()
      if (store) {
        try {
          await store.delete(rel)
        } catch {
          // já não existe
        }
      }
    }
    const abs = path.join(ROOT, rel)
    if (abs.startsWith(ROOT)) {
      try {
        await fsp.unlink(abs)
      } catch {
        // já não existe
      }
    }
  }
}

export async function getStorageUsage(tenantId: string) {
  const dir = path.join(ROOT, safeRelative(tenantId))
  let total = 0
  try {
    await walk(dir, (size) => (total += size))
  } catch {
    total = 0
  }
  return total
}

async function walk(dir: string, onSize: (size: number) => void) {
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(full, onSize)
    } else {
      const stat = await fsp.stat(full)
      onSize(stat.size)
    }
  }
}