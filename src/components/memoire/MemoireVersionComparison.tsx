/**
 * Composant pour afficher la comparaison entre deux versions d'un mémoire
 * Affiche section par section avec indicateur Inchangé/Modifié
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react'

interface MemoireVersionComparisonProps {
  comparison: {
    version1: {
      id: string
      versionNumber: number
      title: string
    }
    version2: {
      id: string
      versionNumber: number
      title: string
    }
    sections: Array<{
      order: number
      title: string
      question?: string | null
      status: 'MODIFIED' | 'UNCHANGED'
      version1: {
        content: string
        status?: string | null
      }
      version2: {
        content: string
        status?: string | null
      }
    }>
  }
}

export function MemoireVersionComparison({ comparison }: MemoireVersionComparisonProps) {
  return (
    <div className="space-y-4">
      {/* En-tête des versions */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Version {comparison.version1.versionNumber}</span>
              <Badge variant="outline">V{comparison.version1.versionNumber}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{comparison.version1.title}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Version {comparison.version2.versionNumber}</span>
              <Badge variant="outline">V{comparison.version2.versionNumber}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{comparison.version2.title}</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des sections */}
      <div className="space-y-3">
        {comparison.sections.map((section) => (
          <Card key={section.order}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Section {section.order} : {section.title}
                </CardTitle>
                <Badge
                  variant={section.status === 'MODIFIED' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {section.status === 'MODIFIED' ? (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Modifié
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Inchangé
                    </>
                  )}
                </Badge>
              </div>
              {section.question && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  {section.question}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Version 1 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      V{comparison.version1.versionNumber}
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded p-3 text-sm min-h-[100px]">
                    {section.version1.content ? (
                      <pre className="whitespace-pre-wrap font-sans">{section.version1.content}</pre>
                    ) : (
                      <span className="text-muted-foreground italic">[Section vide]</span>
                    )}
                  </div>
                </div>

                {/* Version 2 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      V{comparison.version2.versionNumber}
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded p-3 text-sm min-h-[100px]">
                    {section.version2.content ? (
                      <pre className="whitespace-pre-wrap font-sans">{section.version2.content}</pre>
                    ) : (
                      <span className="text-muted-foreground italic">[Section vide]</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

