/**
 * Composant pour afficher et gérer les commentaires d'une section
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ApiResponse } from '@/types/api'

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    name: string | null
    email: string
  }
  replies?: Comment[]
}

interface SectionCommentsProps {
  sectionId: string
  sectionStatus?: string
  userRole?: 'OWNER' | 'CONTRIBUTOR' | 'REVIEWER'
  onValidationChange?: () => void
  onCommentsChange?: () => void
}

export function SectionComments({
  sectionId,
  sectionStatus,
  userRole,
  onValidationChange,
  onCommentsChange,
}: SectionCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [sectionId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sections/${sectionId}/comments`)
      const data: ApiResponse<Comment[]> = await response.json()

      if (data.success && data.data) {
        setComments(data.data)
      } else {
        throw new Error(data.error?.message || 'Erreur lors du chargement')
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      setSending(true)
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoireSectionId: sectionId,
          content: newComment,
        }),
      })

      const data: ApiResponse<Comment> = await response.json()

      if (data.success) {
        setNewComment('')
        await fetchComments() // Recharger les commentaires
        toast.success('Commentaire ajouté')
        onCommentsChange?.() // Notifier le parent pour mettre à jour le compteur
      } else {
        throw new Error(data.error?.message || 'Erreur')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'ajout')
    } finally {
      setSending(false)
    }
  }

  const handleReply = async (parentCommentId: string) => {
    if (!replyContent.trim()) return

    try {
      setSending(true)
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memoireSectionId: sectionId,
          content: replyContent,
          parentCommentId,
        }),
      })

      const data: ApiResponse<Comment> = await response.json()

      if (data.success) {
        setReplyContent('')
        setReplyingTo(null)
        await fetchComments()
        toast.success('Réponse ajoutée')
        onCommentsChange?.() // Notifier le parent pour mettre à jour le compteur
      } else {
        throw new Error(data.error?.message || 'Erreur')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSending(false)
    }
  }

  const handleValidate = async () => {
    if (!(userRole === 'OWNER' || userRole === 'REVIEWER')) return

    try {
      setValidating(true)
      const response = await fetch(`/api/sections/${sectionId}/validate`, {
        method: 'POST',
      })

      const data: ApiResponse<any> = await response.json()

      if (data.success) {
        toast.success('Section validée')
        if (onValidationChange) {
          onValidationChange()
        }
      } else {
        throw new Error(data.error?.message || 'Erreur')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la validation')
    } finally {
      setValidating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const canValidate = userRole === 'OWNER' || userRole === 'REVIEWER'
  const isValidated = sectionStatus === 'VALIDATED'

  return (
    <div className="h-full flex flex-col">
      <div className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Commentaires
          </div>
          {canValidate && !isValidated && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleValidate}
              disabled={validating}
            >
              {validating ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 mr-2" />
                  Valider
                </>
              )}
            </Button>
          )}
          {isValidated && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Validé
            </Badge>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden pt-4">
        {/* Liste des commentaires */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Aucun commentaire
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="border-b pb-3 last:border-0">
                <div className="flex items-start gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {comment.author.name || comment.author.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs mt-1"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    >
                      {replyingTo === comment.id ? 'Annuler' : 'Répondre'}
                    </Button>
                  </div>
                </div>

                {/* Formulaire de réponse */}
                {replyingTo === comment.id && (
                  <div className="ml-8 mt-2 space-y-2">
                    <Textarea
                      placeholder="Votre réponse..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={sending || !replyContent.trim()}
                      >
                        {sending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3 mr-1" />
                        )}
                        Envoyer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyContent('')
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}

                {/* Réponses */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 mt-3 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <User className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {reply.author.name || reply.author.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-foreground whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Formulaire d'ajout de commentaire */}
        <div className="border-t pt-3 space-y-2">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={sending || !newComment.trim()}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="h-3 w-3 mr-2" />
                Ajouter un commentaire
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

