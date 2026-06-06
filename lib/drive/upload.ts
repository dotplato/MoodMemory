export interface UploadBinaryFileInput {
  accessToken: string
  parentId: string
  name: string
  mimeType: string
  buffer: Buffer
}

export async function uploadBinaryFile({
  accessToken,
  parentId,
  name,
  mimeType,
  buffer,
}: UploadBinaryFileInput): Promise<string> {
  const boundary = `moodmemory_${Date.now()}`
  const metadata = JSON.stringify({
    name,
    parents: [parentId],
  })

  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`
  )
  const closing = Buffer.from(`\r\n--${boundary}--`)
  const body = Buffer.concat([preamble, buffer, closing])

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,size,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
    }
  )

  const data = (await response.json()) as {
    id?: string
    size?: string
    mimeType?: string
    error?: { message?: string }
  }

  if (!response.ok || !data.id) {
    throw new Error(
      data.error?.message ?? `Drive upload failed (${response.status})`
    )
  }

  const uploadedSize = Number(data.size ?? 0)
  if (uploadedSize < 128) {
    throw new Error("Drive upload completed but the file is empty")
  }

  return data.id
}

export async function verifyDriveFile(
  accessToken: string,
  fileId: string,
  minSize = 128
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=size,trashed,mimeType`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  const data = (await response.json()) as {
    size?: string
    trashed?: boolean
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Uploaded file could not be verified")
  }

  if (data.trashed) {
    throw new Error("Uploaded file was trashed unexpectedly")
  }

  if (Number(data.size ?? 0) < minSize) {
    throw new Error("Uploaded file is empty on Google Drive")
  }
}
