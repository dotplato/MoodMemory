import { Readable } from "node:stream"
import type { drive_v3 } from "googleapis"

export const MOODMEMORY_ROOT = "MoodMemory"
export const INDEX_FILENAME = "moodmemory-index.json"

export const FOLDER_NAMES = {
  images: "images",
  metadata: "metadata",
  collections: "collections",
} as const

export function toReadableBody(data: Buffer | string): Readable {
  return Readable.from(data)
}

export async function findFolderByName(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string | null> {
  const query = [
    "mimeType='application/vnd.google-apps.folder'",
    `name='${name.replace(/'/g, "\\'")}'`,
    "trashed=false",
    parentId ? `'${parentId}' in parents` : "'root' in parents",
  ].join(" and ")

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    pageSize: 1,
  })

  return response.data.files?.[0]?.id ?? null
}

export async function createFolder(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string> {
  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id",
  })

  if (!response.data.id) {
    throw new Error(`Failed to create folder: ${name}`)
  }

  return response.data.id
}

export async function readJsonFile<T>(
  drive: drive_v3.Drive,
  fileId: string
): Promise<T> {
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  )

  const buffer = Buffer.from(response.data as ArrayBuffer)
  return JSON.parse(buffer.toString("utf-8")) as T
}

export async function writeJsonFile(
  drive: drive_v3.Drive,
  fileId: string,
  data: unknown
): Promise<void> {
  await drive.files.update({
    fileId,
    media: {
      mimeType: "application/json",
      body: toReadableBody(JSON.stringify(data, null, 2)),
    },
  })
}

export async function createJsonFile(
  drive: drive_v3.Drive,
  name: string,
  parentId: string,
  data: unknown
): Promise<string> {
  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/json",
      parents: [parentId],
    },
    media: {
      mimeType: "application/json",
      body: toReadableBody(JSON.stringify(data, null, 2)),
    },
    fields: "id",
  })

  if (!response.data.id) {
    throw new Error(`Failed to create JSON file: ${name}`)
  }

  return response.data.id
}

export async function findFileByName(
  drive: drive_v3.Drive,
  name: string,
  parentId: string
): Promise<string | null> {
  const query = [
    `name='${name.replace(/'/g, "\\'")}'`,
    `'${parentId}' in parents`,
    "trashed=false",
  ].join(" and ")

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    pageSize: 1,
  })

  return response.data.files?.[0]?.id ?? null
}

export async function deleteFile(
  drive: drive_v3.Drive,
  fileId: string
): Promise<void> {
  await drive.files.delete({ fileId })
}

export function getMimeTypeFromUrl(url: string): string {
  const lower = url.split("?")[0]?.toLowerCase() ?? ""
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".svg")) return "image/svg+xml"
  return "image/jpeg"
}

export function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png"
    case "image/gif":
      return "gif"
    case "image/webp":
      return "webp"
    case "image/svg+xml":
      return "svg"
    default:
      return "jpg"
  }
}
