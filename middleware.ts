import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/image") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/extension/connect")

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(loginUrl)
  }

  if (pathname === "/login" && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin))
  }

  return undefined
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/collections/:path*",
    "/image/:path*",
    "/settings/:path*",
    "/extension/connect",
    "/login",
  ],
}
