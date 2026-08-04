import "server-only"
import fs from "fs"
import fsp from "fs/promises"
import path from "path"
import crypto from "crypto"

const ROOT = path.join(process.cwd(), process.env.STORAGE_DIR || "storage")

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
  const dirPath = path.join(ROOT, safeSubdir)
  await fsp.mkdir(dirPath, { recursive: true })

  const name = options.filename ?? crypto.randomBytes(16).toString("hex")
  const ext = options.ext ? (options.ext.startsWith(".") ? options.ext : `.${options.ext}`) : ""
  const fileName = `${name}${ext}`
  const relativePath = path.join(safeSubdir, fileName)
  await fsp.writeFile(path.join(ROOT, relativePath), buffer)

  return relativePath.replace(/\\/g, "/")
}

export async function readFileBuffer(relativePath: string) {
  const abs = path.join(ROOT, path.normalize(relativePath))
  if (!abs.startsWith(ROOT)) return null
  if (!fs.existsSync(abs)) return null
  return await fsp.readFile(abs)
}

export async function removeFile(relativePath?: string | null) {
  if (!relativePath) return
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
  if (buffer.toString("ascii", 0, 4) === "DICM") return "image/dicom"
  return declaredMime || null
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