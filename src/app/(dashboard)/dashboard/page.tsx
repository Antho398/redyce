/**
 * Page Dashboard - Vue d'ensemble avec clients et métriques
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus, Users, FolderKanban, FileText, TrendingUp, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProjectHeader } from '@/components/projects/ProjectHeader'

interface Client {
  id: string
  name: string
  companyName?: string
  _count?: {
    projects: number
    methodologyDocuments: number
  }
}

interface DashboardStats {
  totalClients: number
  totalProjects: number
  totalDocuments: number
  recentActivity: number
}

const CLIENT_COLORS = [
  'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
  'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
  'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
  'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
  'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200',
  'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200',
  'bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200',
  'bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200',
]

const CLIENT_TEXT_COLORS = [
  'text-blue-700',
  'text-purple-700',
  'text-green-700',
  'text-orange-700',
  'text-pink-700',
  'text-indigo-700',
  'text-teal-700',
  'text-rose-700',
]

const CLIENT_ICON_COLORS = [
  'text-blue-500',
  'text-purple-500',
  'text-green-500',
  'text-orange-500',
  'text-pink-500',
  'text-indigo-500',
  'text-teal-500',
  'text-rose-500',
]

export default function DashboardPage() {
  const router = useRouter()
  const { status } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProjects: 0,
    totalDocuments: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData()
    }
  }, [status])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch clients
      const clientsResponse = await fetch('/api/clients')
      const clientsData = await clientsResponse.json()

      if (clientsData.success) {
        const clientsList = clientsData.data || []
        setClients(clientsList)

        // Calculate stats
        const totalProjects = clientsList.reduce(
          (sum: number, client: Client) => sum + (client._count?.projects || 0),
          0
        )
        const totalDocuments = clientsList.reduce(
          (sum: number, client: Client) => sum + (client._count?.methodologyDocuments || 0),
          0
        )

        setStats({
          totalClients: clientsList.length,
          totalProjects,
          totalDocuments,
          recentActivity: clientsList.length, // Simplified for now
        })
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const getClientColor = (index: number) => {
    return CLIENT_COLORS[index % CLIENT_COLORS.length]
  }

  const getClientTextColor = (index: number) => {
    return CLIENT_TEXT_COLORS[index % CLIENT_TEXT_COLORS.length]
  }

  const getClientIconColor = (index: number) => {
    return CLIENT_ICON_COLORS[index % CLIENT_ICON_COLORS.length]
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4 px-4">
      {/* Header */}
      <ProjectHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de vos clients et projets"
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Clients"
          value={stats.totalClients}
          icon={<Users className="h-5 w-5" />}
          color="bg-blue-500"
          trend="+12%"
        />
        <MetricCard
          title="Projets"
          value={stats.totalProjects}
          icon={<FolderKanban className="h-5 w-5" />}
          color="bg-purple-500"
          trend="+8%"
        />
        <MetricCard
          title="Documents"
          value={stats.totalDocuments}
          icon={<FileText className="h-5 w-5" />}
          color="bg-green-500"
          trend="+23%"
        />
        <MetricCard
          title="Activité récente"
          value={stats.recentActivity}
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-orange-500"
          trend="+5%"
        />
      </div>

      {/* Clients Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Mes Clients</h2>
            <p className="text-sm text-muted-foreground">
              Sélectionnez un client pour voir ses projets
            </p>
          </div>
          <Button
            onClick={() => router.push('/clients/new')}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </div>

        {clients.length === 0 ? (
          <EmptyClientsState onCreateClick={() => router.push('/clients/new')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client, index) => (
              <ClientCard
                key={client.id}
                client={client}
                color={getClientColor(index)}
                textColor={getClientTextColor(index)}
                iconColor={getClientIconColor(index)}
                onClick={() => router.push(`/clients/${client.id}/projects`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  trend?: string
}

function MetricCard({ title, value, icon, color, trend }: MetricCardProps) {
  // Map des couleurs vives aux couleurs subtiles
  const colorMap: Record<string, string> = {
    'bg-blue-500': 'bg-blue-50 text-blue-600 border border-blue-200',
    'bg-purple-500': 'bg-purple-50 text-purple-600 border border-purple-200',
    'bg-green-500': 'bg-green-50 text-green-600 border border-green-200',
    'bg-orange-500': 'bg-orange-50 text-orange-600 border border-orange-200',
  }

  const subtleColor = colorMap[color] || 'bg-primary/10 text-primary border border-primary/20'

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`${subtleColor} p-3 rounded-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ClientCardProps {
  client: Client
  color: string
  textColor: string
  iconColor: string
  onClick: () => void
}

function ClientCard({ client, color, textColor, iconColor, onClick }: ClientCardProps) {
  const projectCount = client._count?.projects || 0
  const docCount = client._count?.methodologyDocuments || 0

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden group border-2"
      onClick={onClick}
    >
      <div className={`${color} h-20 relative border-b-2`}>
        <div className="absolute inset-0 flex items-center px-4">
          <div className="flex items-center gap-3 w-full">
            <div className={`${iconColor} bg-white/80 p-2 rounded-lg flex-shrink-0`}>
              <Users className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`${textColor} font-semibold text-base truncate`}>
                {client.name}
              </h3>
              {client.companyName && (
                <p className={`${textColor} opacity-75 text-xs truncate`}>{client.companyName}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FolderKanban className="h-4 w-4" />
              <span>{projectCount} {projectCount > 1 ? 'projets' : 'projet'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{docCount} doc{docCount > 1 ? 's' : ''}</span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyClientsState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/25">
      <CardContent className="flex flex-col items-center text-center py-12 px-4">
        <div className="mb-4">
          <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center border border-border/50 mx-auto">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Aucun client
        </h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-md">
          Créez votre premier client pour organiser vos projets et gérer leur méthodologie.
        </p>
        <Button onClick={onCreateClick} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Créer un client
        </Button>
      </CardContent>
    </Card>
  )
}
