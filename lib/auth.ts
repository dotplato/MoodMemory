import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { refreshAccessToken } from "@/lib/google-token"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    error?: string
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    error?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + 3600 * 1000,
        }
      }

      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires - 60_000
      ) {
        return token
      }

      if (!token.refreshToken) {
        return { ...token, error: "RefreshTokenMissing" }
      }

      try {
        const refreshed = await refreshAccessToken(token.refreshToken)
        return {
          ...token,
          accessToken: refreshed.accessToken,
          accessTokenExpires: refreshed.expiresAt,
          error: undefined,
        }
      } catch {
        return { ...token, error: "RefreshAccessTokenError" }
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.error = token.error
      return session
    },
  },
})
