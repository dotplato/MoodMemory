import {
  getAuthenticatedDriveToken,
  verifyExtensionToken,
} from "@/lib/auth-tokens"
import {
  corsOptionsResponse,
  extensionCorsHeaders,
} from "@/lib/api/cors"
import { createDriveService } from "@/lib/drive/service"
import type { SaveImageInput } from "@/lib/types/image"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null

  let accessToken: string | null = null

  if (bearerToken) {
    const verified = await verifyExtensionToken(bearerToken)
    accessToken = verified?.accessToken ?? null
  } else {
    accessToken = await getAuthenticatedDriveToken()
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: extensionCorsHeaders() }
    )
  }

  let body: SaveImageInput
  try {
    body = (await request.json()) as SaveImageInput
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: extensionCorsHeaders() }
    )
  }

  if (!body.imageUrl || !body.pageUrl) {
    return NextResponse.json(
      { error: "imageUrl and pageUrl are required" },
      { status: 400, headers: extensionCorsHeaders() }
    )
  }

  try {
    const service = createDriveService(accessToken)
    await service.initializeMoodMemory()
    const image = await service.uploadImage({
      ...body,
      pageTitle: body.pageTitle || "Untitled",
    })
    revalidatePath("/dashboard")
    revalidatePath("/collections")
    return NextResponse.json(
      { success: true, image },
      { headers: extensionCorsHeaders() }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save image"
    return NextResponse.json(
      { error: message },
      { status: 500, headers: extensionCorsHeaders() }
    )
  }
}
