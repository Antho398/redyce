/**
 * Providers wrapper - Client Component pour wrapper tous les providers
 */

"use client"

import { SessionProvider } from "./SessionProvider"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { Toaster } from "sonner"

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <SessionProvider>
        {children}
        <Toaster position="top-right" richColors expand={true} stacked={true} />
      </SessionProvider>
    </ThemeProvider>
  )
}

