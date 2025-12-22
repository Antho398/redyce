/**
 * Sidebar Premium Redyce
 * Fond #f8f9fd, contour subtil, icônes modernisées
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/helpers'
import {
  LayoutDashboard,
  Building2,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Paramètres',
    href: '/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ 
  isOpen = true, 
  onClose,
  collapsed = false,
  onToggleCollapse
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Premium */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen border-r border-border bg-card transition-all duration-300 shadow-sm lg:translate-x-0',
          collapsed ? 'w-16' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-expanded={!collapsed}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            "flex h-16 items-center border-b border-border bg-card/50 relative",
            collapsed ? "justify-center px-2" : "justify-start px-6"
          )}>
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-2.5 text-xl font-bold text-foreground transition-colors hover:text-primary overflow-hidden",
                collapsed && "justify-center"
              )}
              title={collapsed ? "Redyce" : undefined}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 16C8 13.7909 9.79086 12 12 12H20C22.2091 12 24 13.7909 24 16C24 18.2091 22.2091 20 20 20H12C9.79086 20 8 18.2091 8 16Z" fill="#E3E7FF"/>
                  <path d="M12 14C10.8954 14 10 14.8954 10 16C10 17.1046 10.8954 18 12 18H20C21.1046 18 22 17.1046 22 16C22 14.8954 21.1046 14 20 14H12Z" fill="#151959"/>
                  <circle cx="14" cy="16" r="1.5" fill="#E3E7FF"/>
                  <circle cx="18" cy="16" r="1.5" fill="#E3E7FF"/>
                </svg>
              </div>
              {!collapsed && <span className="tracking-tight whitespace-nowrap">Redyce</span>}
            </Link>
            {!collapsed && onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 rounded-xl absolute right-4"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 p-4">
            {/* Bouton toggle collapse - toujours visible, au-dessus de Dashboard */}
            {onToggleCollapse && (
              <div className={cn(
                "flex",
                collapsed ? "justify-center" : "justify-start"
              )}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex h-8 w-8 rounded-xl"
                  onClick={onToggleCollapse}
                  aria-label={collapsed ? "Déplier la sidebar" : "Replier la sidebar"}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? (
                    <ChevronRight className="h-5 w-5" />
                  ) : (
                    <ChevronLeft className="h-5 w-5" />
                  )}
                </Button>
              </div>
            )}
            {navItems.map((item) => {
              const Icon = item.icon
              let isActive = false

              if (item.title === 'Dashboard') {
                isActive = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
              } else if (item.title === 'Clients') {
                isActive = pathname === '/clients' || pathname.startsWith('/clients/')
              } else {
                isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')
              }

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden',
                    collapsed ? 'justify-center px-3.5 py-2.5' : 'gap-3 px-3.5 py-2.5',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className={cn(
                    'h-5 w-5 flex-shrink-0',
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  )} />
                  {!collapsed && <span className="whitespace-nowrap">{item.title}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          {!collapsed && (
            <div className="border-t border-border p-4 bg-card/30">
              <div className="rounded-xl bg-card/60 p-3 text-xs text-muted-foreground border border-border">
                <p className="font-semibold text-foreground">Version 1.0</p>
                <p className="mt-1">L'IA au cœur de vos projets</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
