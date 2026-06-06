import type { drive_v3 } from "googleapis"

export async function streamToBuffer(
  stream: NodeJS.ReadableStream
): Promise<Buffer> {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

export async function getDriveFileBuffer(
  drive: drive_v3.Drive,
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const [mediaResponse, metaResponse] = await Promise.all([
    drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    ),
    drive.files.get({ fileId, fields: "mimeType" }),
  ])

  return {
    buffer: Buffer.from(mediaResponse.data as ArrayBuffer),
    mimeType: metaResponse.data.mimeType ?? "image/jpeg",
  }
}
