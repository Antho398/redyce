/**
 * Layout pour le dashboard (routes protégées)
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Redyce</h1>
            <div className="flex gap-4">
              <a href="/projects" className="hover:underline">
                Projets
              </a>
              <a href="/documents" className="hover:underline">
                Documents
              </a>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

