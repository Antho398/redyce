/**
 * Header de navigation pour le dashboard Redyce
 * Utilise le design system Redyce
 */

'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

export function DashboardHeader() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <nav className="border-b border-border bg-surface shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Titre */}
          <div className="flex items-center">
            <button
              onClick={() => router.push('/projects')}
              className="text-xl font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Redyce
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-4">
              <a
                href="/projects"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Projets
              </a>
              <a
                href="/documents"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Documents
              </a>
              <a
                href="/consumption"
                className="text-sm font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Consommation
              </a>
            </nav>

            {/* User info & logout */}
            {session?.user && (
              <div className="flex items-center gap-3 border-l border-border pl-6">
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{session.user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Déconnexion</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

