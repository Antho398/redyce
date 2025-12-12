/**
 * Page de liste des projets
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Données factices pour la démonstration
const mockProjects = [
  {
    id: '1',
    name: 'Rénovation École Primaire',
    description: 'Mémoire technique pour la rénovation complète d\'une école primaire',
    documentCount: 5,
    memoryCount: 2,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Construction Bureaux',
    description: 'Appel d\'offres pour la construction de nouveaux bureaux',
    documentCount: 8,
    memoryCount: 1,
    createdAt: '2024-01-20',
  },
  {
    id: '3',
    name: 'Aménagement Espace Public',
    description: 'Projet d\'aménagement d\'un espace public en centre-ville',
    documentCount: 3,
    memoryCount: 0,
    createdAt: '2024-01-25',
  },
]

export default function ProjectsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mes Projets</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos projets et générez vos mémoires techniques
          </p>
        </div>
        <Button asChild>
          <a href="/projects/new">Nouveau Projet</a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{project.name}</CardTitle>
              <CardDescription>{project.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                <div className="flex justify-between">
                  <span>Documents:</span>
                  <span className="font-medium">{project.documentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mémoires:</span>
                  <span className="font-medium">{project.memoryCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Créé le:</span>
                  <span className="font-medium">{project.createdAt}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={`/projects/${project.id}`}>Voir</a>
                </Button>
                <Button variant="default" className="flex-1" asChild>
                  <a href={`/memoire/${project.id}`}>Générer</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Vous n&apos;avez pas encore de projet
          </p>
          <Button asChild>
            <a href="/projects/new">Créer votre premier projet</a>
          </Button>
        </div>
      )}
    </div>
  )
}

