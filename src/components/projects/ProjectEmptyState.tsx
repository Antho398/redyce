/**
 * État vide discret - Design Linear/Notion/Figma
 * Card simple, compacte, sans effets lourds
 */

'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderPlus } from 'lucide-react'

export function ProjectEmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-8">
      <Card className="w-full max-w-md rounded-xl border border-border/50 bg-card">
        <CardContent className="flex flex-col items-center text-center py-6 px-6">
          {/* Icône discrète */}
          <div className="mb-4">
            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center border border-border/50 mx-auto">
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Texte sobre */}
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Aucun projet pour le moment
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Créez votre premier projet pour commencer à uploader des documents,
            extraire des DPGF et générer des CCTP automatiquement avec l'IA.
          </p>

          {/* Bouton discret */}
          <Button
            size="default"
            className="gap-2 rounded-xl"
            asChild
          >
            <Link href="/projects/new">
              <FolderPlus className="h-4 w-4" />
              Créer un projet
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
