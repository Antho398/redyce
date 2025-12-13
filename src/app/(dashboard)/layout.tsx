/**
 * Layout pour le dashboard (routes protégées)
 * Utilise le nouveau layout SaaS avec Sidebar + Topbar
 */

"use client"

import { Layout } from "@/components/layout/Layout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>
}

