/**
 * Providers wrapper - Client Component pour wrapper tous les providers
 */

"use client"

import { SessionProvider } from "./SessionProvider"
import { Toaster } from "sonner"

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" richColors />
    </SessionProvider>
  )
}

