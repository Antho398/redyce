/**
 * Layout pour le dashboard (routes protégées)
 * Utilise le nouveau layout SaaS avec Sidebar + Topbar
 * Intègre le système de tutoriel onboarding
 */

"use client"

import { Layout } from "@/components/layout/Layout"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { TutorialOverlay } from "@/components/tutorial"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TutorialProvider>
      <Layout>{children}</Layout>
      <TutorialOverlay />
    </TutorialProvider>
  )
}

