import { getAuthenticatedDriveToken } from "@/lib/auth-tokens"
import { createDriveService } from "@/lib/drive/service"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const accessToken = await getAuthenticatedDriveToken()

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const service = createDriveService(accessToken)
    const image = await service.getImageMetadata(id)

    if (!image) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { buffer, mimeType } = await service.getImageBuffer(image.imageDriveId)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 })
  }
}
