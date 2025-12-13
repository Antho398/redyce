/**
 * Middleware NextAuth pour protéger les routes
 */

export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/projects/:path*",
    "/dashboard/:path*",
    "/api/projects/:path*",
    "/api/documents/:path*",
    "/api/dpgf/:path*",
    "/api/cctp/:path*",
    "/api/ai/:path*",
  ],
}

