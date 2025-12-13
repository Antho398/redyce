/**
 * Layout pour le dashboard (routes protégées)
 */

"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Redyce</h1>
            <div className="flex items-center gap-4">
              <a href="/projects" className="hover:underline">
                Projets
              </a>
              <a href="/documents" className="hover:underline">
                Documents
              </a>
              <a href="/consumption" className="hover:underline">
                Consommation
              </a>
              {session?.user && (
                <>
                  <span className="text-sm text-gray-600">
                    {session.user.email}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Déconnexion
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

