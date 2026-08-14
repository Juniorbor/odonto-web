import "server-only"
import fs from "fs"
import fsp from "fs/promises"
import path from "path"
import crypto from "crypto"
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "@/lib/prisma"

const ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), process.env.STORAGE_DIR || "storage")

const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY
const S3_BUCKET = process.env.S3_BUCKET
const S3_ENABLED = !!(S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY && S3_BUCKET)

let s3Client: S3Client | null = null
let s3InitError: string | null = null

export function storageStatus() {
  return {
    s3: S3_ENABLED,
    storeReady: s3Client !== null,
    initError: s3InitError,
  }
}

function s3Api() {
  if (s3Client) return s3Client
  if (!S3_ENABLED || s3InitError) return null
  try {
    s3Client = new S3Client({
      region: "auto",
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID!,
        secretAccessKey: S3_SECRET_ACCESS_KEY!,
      },
    })
    return s3Client
  } catch (e) {
    s3InitError = (e as Error).message
    console.error("S3 indisponível:", s3InitError)
    return null
  }
}

async function s3Set(relativePath: string, buffer: Buffer) {
  const client = s3Api()
  if (!client) return false
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: relativePath,
        Body: buffer,
      }),
    )
    return true
  } catch (e) {
    console.error("S3 indisponível para gravação:", (e as Error).message)
    return false
  }
}

async function s3Get(relativePath: string): Promise<Buffer | null> {
  const client = s3Api()
  if (!client) return null
  try {
    const res = await client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: relativePath,
      }),
    )
    if (!res.Body) return null
    const bytes = await res.Body.transformToByteArray()
    return Buffer.from(bytes)
  } catch (e) {
    const status = (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    if (status !== 404) console.error("S3 indisponível para leitura:", (e as Error).message)
    return null
  }
}

async function s3Delete(relativePath: string) {
  const client = s3Api()
  if (!client) return
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: relativePath,
      }),
    )
  } catch (e) {
    console.error("S3 indisponível para remoção:", (e as Error).message)
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
      `Armazenamento de arquivos indisponível no servidor (${reason}). Verifique a permissão de escrita da pasta de arquivos.`,
    )
  }
}

/** Grava um buffer no banco (fallback universal — funciona em serverless). */
async function saveToDb(relativePath: string, buffer: Buffer) {
  const data = new Uint8Array(buffer)
  await prisma.storedFile.upsert({
    where: { path: relativePath },
    update: { data, sizeBytes: buffer.length },
    create: { path: relativePath, data, sizeBytes: buffer.length },
  })
}

async function readFromDb(relativePath: string): Promise<Buffer | null> {
  try {
    const row = await prisma.storedFile.findUnique({
      where: { path: relativePath },
      select: { data: true },
    })
    return row ? Buffer.from(row.data) : null
  } catch {
    return null
  }
}

async function removeFromDb(relativePath: string) {
  try {
    await prisma.storedFile.deleteMany({ where: { path: relativePath } })
  } catch {
    // já não existe
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

  if (S3_ENABLED && (await s3Set(relativePath, buffer))) return relativePath

  try {
    await saveToDb(relativePath, buffer)
    return relativePath
  } catch (e) {
    console.error("Banco indisponível para arquivo, gravando no disco:", e)
  }

  await writeFileToDisk(relativePath, buffer)

  return relativePath
}

export async function readFileBuffer(relativePath: string): Promise<Buffer | null> {
  if (S3_ENABLED) {
    const fromS3 = await s3Get(relativePath)
    if (fromS3) return fromS3
  }
  const fromDb = await readFromDb(relativePath)
  if (fromDb) return fromDb
  const abs = path.join(ROOT, path.normalize(relativePath))
  if (!abs.startsWith(ROOT)) return null
  if (!fs.existsSync(abs)) return null
  try {
    return Buffer.from(await fsp.readFile(abs))
  } catch {
    return null
  }
}

export async function removeFile(relativePath?: string | null) {
  if (!relativePath) return
  if (S3_ENABLED) await s3Delete(relativePath)
  await removeFromDb(relativePath)
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
 * Upload em partes: cada pedaço é guardado isolado (S3, banco ou disco) e só é
 * montado no último. Necessário para contornar o limite de corpo das funções
 * serverless (~4,5MB), mantendo arquivos de até 25MB.
 */
export async function saveChunk(tenantId: string, uploadId: string, index: number, buffer: Buffer) {
  const rel = safeRelative(CHUNK_SUBDIR, tenantId, uploadId, `${index}.part`)
  if (S3_ENABLED && (await s3Set(rel, buffer))) return
  try {
    await saveToDb(rel, buffer)
    return
  } catch (e) {
    console.error("Banco indisponível para chunk, gravando no disco:", e)
  }
  await writeFileToDisk(rel, buffer)
}

export async function assembleChunks(tenantId: string, uploadId: string, total: number): Promise<Buffer | null> {
  const parts: Buffer[] = []
  for (let i = 0; i < total; i++) {
    const rel = safeRelative(CHUNK_SUBDIR, tenantId, uploadId, `${i}.part`)
    if (S3_ENABLED) {
      const fromS3 = await s3Get(rel)
      if (fromS3) {
        parts.push(fromS3)
        continue
      }
    }
    const fromDb = await readFromDb(rel)
    if (fromDb) {
      parts.push(fromDb)
      continue
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
    if (S3_ENABLED) await s3Delete(rel)
    await removeFromDb(rel)
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
  try {
    const agg = await prisma.storedFile.aggregate({
      where: { path: { startsWith: `${tenantId}/` } },
      _sum: { sizeBytes: true },
    })
    total += agg._sum.sizeBytes ?? 0
  } catch {
    // banco indisponível
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