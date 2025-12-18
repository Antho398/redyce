/**
 * Contexte de thème pour gérer le mode sombre/clair/système
 * Persiste le choix dans localStorage (clé: redyce_theme)
 * 
 * Anti-flash: Un script inline est injecté dans le layout pour appliquer
 * le thème AVANT le premier rendu React (voir layout.tsx)
 */

'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { toast } from 'sonner'

// Clé localStorage pour persister le thème
export const THEME_STORAGE_KEY = 'redyce_theme'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme, showFeedback?: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

function applyThemeToDocument(resolvedTheme: ResolvedTheme) {
  const root = document.documentElement
  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialiser avec les valeurs du localStorage (si disponible côté client)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    return saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'system'
  })
  
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    const effectiveTheme = saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'system'
    return resolveTheme(effectiveTheme)
  })

  // Synchroniser le thème résolu quand le thème change
  useEffect(() => {
    const newResolved = resolveTheme(theme)
    setResolvedTheme(newResolved)
    applyThemeToDocument(newResolved)
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  // Écouter les changements de préférence système si le thème est "system"
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newResolved = getSystemTheme()
      setResolvedTheme(newResolved)
      applyThemeToDocument(newResolved)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = useCallback((newTheme: Theme, showFeedback = true) => {
    setThemeState(newTheme)
    
    if (showFeedback) {
      const labels: Record<Theme, string> = {
        light: 'Mode clair activé',
        dark: 'Mode sombre activé',
        system: 'Thème système activé'
      }
      toast.success(labels[newTheme], {
        duration: 2000,
        position: 'bottom-right',
      })
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Script inline à injecter dans le <head> pour éviter le flash de thème.
 * Ce script s'exécute AVANT React et applique immédiatement le thème.
 * 
 * Logique :
 * - Choix utilisateur stocké : "light" | "dark" | "system"
 * - Si "system" → utilise prefers-color-scheme de l'OS
 * - Applique TOUJOURS soit .light soit .dark sur <html> (jamais .system)
 */
export const themeScript = `
(function() {
  try {
    var storedTheme = localStorage.getItem('${THEME_STORAGE_KEY}');
    var resolvedTheme = 'light';
    
    if (storedTheme === 'dark') {
      resolvedTheme = 'dark';
    } else if (storedTheme === 'light') {
      resolvedTheme = 'light';
    } else {
      // 'system' ou pas de valeur → détection OS
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Appliquer le thème résolu (toujours light ou dark, jamais system)
    var html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(resolvedTheme);
  } catch (e) {
    // Fallback : mode clair
    document.documentElement.classList.add('light');
  }
})();
`

