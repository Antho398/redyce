/**
 * Topbar Premium Redyce
 * Header réduit, élégant, avec avatar rond, fond blanc, ombrage léger
 */

'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Menu, Settings } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const getUserInitials = (email?: string | null) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border/50 bg-white/80 backdrop-blur-sm px-4 lg:px-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]" style={{ height: 'var(--app-header-height)' }}>
      {/* Menu button (mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 rounded-xl"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      {session?.user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2.5 px-2.5 py-1.5 h-auto rounded-xl hover:bg-[#f8f9fd]"
            >
              <Avatar className="h-9 w-9 rounded-full border-2 border-white shadow-sm">
                <AvatarFallback className="bg-[#151959] text-white text-sm font-semibold">
                  {getUserInitials(session.user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium text-[#151959]">
                {session.user.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-border/50"
          >
            <DropdownMenuLabel className="rounded-t-xl">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-[#151959]">
                  Mon compte
                </p>
                <p className="text-xs leading-none text-[#64748b]">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem asChild className="rounded-lg">
              <a href="/settings" className="flex items-center gap-2.5 cursor-pointer">
                <Settings className="h-4 w-4" />
                Paramètres
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive rounded-lg"
            >
              <LogOut className="h-4 w-4 mr-2.5" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
