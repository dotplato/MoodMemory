import { getToken } from "@auth/core/jwt"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"
import { refreshAccessToken } from "@/lib/google-token"

const EXTENSION_TOKEN_EXPIRY = "30d"

interface ExtensionTokenPayload {
  email: string
  refreshToken?: string
  accessToken?: string
  accessTokenExpires?: number
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured")
  }
  return new TextEncoder().encode(secret)
}

async function getAuthJwtFromCookies() {
  const cookieStore = await cookies()
  const cookie = cookieStore
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ")

  return getToken({
    req: { headers: { cookie } },
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  })
}

export async function createExtensionToken(): Promise<string | null> {
  const session = await auth()
  if (!session?.user?.email || session.error) {
    return null
  }

  const authToken = await getAuthJwtFromCookies()
  const refreshToken = authToken?.refreshToken as string | undefined
  const accessToken = authToken?.accessToken as string | undefined
  const accessTokenExpires = authToken?.accessTokenExpires as number | undefined

  if (!refreshToken) {
    return null
  }

  return new SignJWT({
    email: session.user.email,
    refreshToken,
    accessToken,
    accessTokenExpires,
  } satisfies ExtensionTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXTENSION_TOKEN_EXPIRY)
    .sign(getSecretKey())
}

async function decodeExtensionToken(
  token: string
): Promise<ExtensionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    const email = payload.email as string | undefined

    if (!email) {
      return null
    }

    return {
      email,
      refreshToken: payload.refreshToken as string | undefined,
      accessToken: payload.accessToken as string | undefined,
      accessTokenExpires: payload.accessTokenExpires as number | undefined,
    }
  } catch {
    return null
  }
}

export async function getExtensionDriveAccessToken(
  token: string
): Promise<string | null> {
  const payload = await decodeExtensionToken(token)
  if (!payload) {
    return null
  }

  if (
    payload.accessToken &&
    payload.accessTokenExpires &&
    Date.now() < payload.accessTokenExpires - 60_000
  ) {
    return payload.accessToken
  }

  if (!payload.refreshToken) {
    return payload.accessToken ?? null
  }

  try {
    const refreshed = await refreshAccessToken(payload.refreshToken)
    return refreshed.accessToken
  } catch {
    return null
  }
}

/** @deprecated Use getExtensionDriveAccessToken instead */
export async function verifyExtensionToken(token: string): Promise<{
  email: string
  accessToken: string
} | null> {
  const payload = await decodeExtensionToken(token)
  if (!payload) {
    return null
  }

  const accessToken = await getExtensionDriveAccessToken(token)
  if (!accessToken) {
    return null
  }

  return {
    email: payload.email,
    accessToken,
  }
}

export async function getAuthenticatedDriveToken(): Promise<string | null> {
  const session = await auth()
  if (!session?.accessToken || session.error) {
    return null
  }
  return session.accessToken
}
