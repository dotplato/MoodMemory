import { createExtensionToken } from "@/lib/auth-tokens"
import { NextResponse } from "next/server"

export async function GET() {
  const token = await createExtensionToken()

  if (!token) {
    return NextResponse.json(
      {
        error:
          "Could not create extension token. Sign out and sign in again to refresh Google permissions.",
      },
      { status: 401 }
    )
  }

  return NextResponse.json({ token })
}
