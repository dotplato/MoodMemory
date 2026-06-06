export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: number
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured")
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  const data = (await response.json()) as {
    access_token?: string
    expires_in?: number
    error?: string
  }

  if (!response.ok || !data.access_token) {
    throw new Error(data.error ?? "Failed to refresh Google access token")
  }

  return {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
}
