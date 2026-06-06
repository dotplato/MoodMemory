import { createExtensionToken } from "@/lib/auth-tokens"
import { NextResponse } from "next/server"

export async function GET() {
  const token = await createExtensionToken()

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({ token })
}
