import { SignJWT, jwtVerify } from "jose"
import { auth } from "@/lib/auth"

const EXTENSION_TOKEN_EXPIRY = "30d"

function getSecretKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured")
  }
  return new TextEncoder().encode(secret)
}

export async function createExtensionToken(): Promise<string | null> {
  const session = await auth()

  if (!session?.accessToken || !session.user?.email) {
    return null
  }

  return new SignJWT({
    email: session.user.email,
    accessToken: session.accessToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXTENSION_TOKEN_EXPIRY)
    .sign(getSecretKey())
}

export async function verifyExtensionToken(token: string): Promise<{
  email: string
  accessToken: string
} | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    const email = payload.email as string | undefined
    const accessToken = payload.accessToken as string | undefined

    if (!email || !accessToken) {
      return null
    }

    return { email, accessToken }
  } catch {
    return null
  }
}

export async function getAuthenticatedDriveToken(): Promise<string | null> {
  const session = await auth()
  if (!session?.accessToken || session.error) {
    return null
  }
  return session.accessToken
}
