/**
 * Composant de suivi de consommation OpenAI
 * Adapté depuis Ergobuddyconnect pour Redyce
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign, Activity, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UsageStats {
  totalRequests: number
  totalTokens: number
  totalCost: number
  monthlyCost: number
  dailyCost: number
  breakdown: {
    [model: string]: {
      requests: number
      tokens: number
      cost: number
    }
  }
  byOperation?: {
    [operation: string]: {
      requests: number
      tokens: number
      cost: number
    }
  }
  byUser?: {
    [userId: string]: {
      email: string
      requests: number
      tokens: number
      cost: number
    }
  }
  recentOperations?: Array<{
    id: string
    operation: string
    model: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    cost: number
    createdAt: Date
    projectId?: string | null
    documentId?: string | null
  }>
}

interface UsageTrackerProps {
  userId?: string // Si fourni, affiche uniquement les stats de cet utilisateur
}

export function UsageTrackerComponent({ userId }: UsageTrackerProps) {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)

  const loadStats = async () => {
    setLoading(true)
    try {
      const url = userId ? `/api/usage?userId=${userId}` : '/api/usage'
      const response = await fetch(url)
      const data = await response.json()

      if (data.success && data.data) {
        setStats(data.data)
      } else {
        toast.error('Erreur lors du chargement des statistiques')
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  const handleClearData = async () => {
    try {
      const url = userId ? `/api/usage?userId=${userId}` : '/api/usage'
      const response = await fetch(url, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Données de consommation effacées')
        await loadStats()
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setShowClearDialog(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [userId])

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Consommation OpenAI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Chargement...</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Consommation OpenAI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Aucune donnée de consommation disponible</p>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Consommation OpenAI
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {!userId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                disabled={loading}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistiques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="text-2xl font-bold text-primary">
              {formatNumber(stats.totalRequests)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Requêtes totales</div>
          </div>

          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalCost)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Coût total</div>
          </div>

          <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.monthlyCost)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Ce mois</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-primary/5 via-accent/10 to-[#F8D347]/20 rounded-lg border border-primary/10">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(stats.dailyCost)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Aujourd'hui</div>
          </div>
        </div>

        {/* Tokens totaux */}
        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="text-xl font-semibold text-foreground">
            {formatNumber(stats.totalTokens)} tokens utilisés
          </div>
          <div className="text-sm text-muted-foreground mt-1">Toutes les opérations confondues</div>
        </div>

        {/* Détail par utilisateur (uniquement si admin) */}
        {!userId && stats.byUser && Object.keys(stats.byUser).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Consommation par utilisateur
            </h4>
            <div className="space-y-3">
              {Object.entries(stats.byUser)
                .sort(([, a], [, b]) => b.cost - a.cost)
                .map(([userId, userStats]) => (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{userStats.email}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatNumber(userStats.requests)} requêtes • {formatNumber(userStats.tokens)} tokens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary text-lg">
                        {formatCurrency(userStats.cost)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Détail par modèle */}
        {Object.keys(stats.breakdown).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Détail par modèle
            </h4>
            <div className="space-y-3">
              {Object.entries(stats.breakdown).map(([model, modelStats]) => (
                <div key={model} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{model}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatNumber(modelStats.requests)} requêtes
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">
                      {formatCurrency(modelStats.cost)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(modelStats.tokens)} tokens
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détail par opération */}
        {stats.byOperation && Object.keys(stats.byOperation).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Coûts par opération
            </h4>
            <div className="space-y-3">
              {Object.entries(stats.byOperation)
                .sort(([, a], [, b]) => b.cost - a.cost)
                .map(([operation, opStats]) => (
                  <div key={operation} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="capitalize">
                        {operation.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatNumber(opStats.requests)} requêtes
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(opStats.cost)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(opStats.tokens)} tokens
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tableau détaillé des dernières opérations */}
        {stats.recentOperations && stats.recentOperations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Détail des dernières opérations (50 dernières)
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.recentOperations.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10 hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline" className="capitalize text-xs">
                      {op.operation.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{op.model}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-foreground">{formatNumber(op.totalTokens)} tokens</div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(op.inputTokens)}/{formatNumber(op.outputTokens)}
                      </div>
                    </div>
                    <div className="text-right font-medium text-foreground min-w-[80px]">
                      {formatCurrency(op.cost)}
                    </div>
                    <div className="text-xs text-muted-foreground min-w-[100px] text-right">
                      {new Date(op.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note d'information */}
        <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
          <strong>Note :</strong> Les coûts sont calculés approximativement selon les tarifs OpenAI actuels.
          {userId && ' Ces statistiques concernent uniquement votre consommation.'}
        </div>
      </CardContent>

      {/* Dialog de suppression */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Effacer les données</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir effacer toutes les données de consommation ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearData} className="bg-red-600 hover:bg-red-700">
              Effacer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

