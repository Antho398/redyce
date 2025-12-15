/**
 * Modal élégant pour confirmer la suppression d'un document
 */

'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'

interface DeleteDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentName: string
  onConfirm: () => Promise<void>
  deleting?: boolean
}

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  documentName,
  onConfirm,
  deleting = false,
}: DeleteDocumentDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Supprimer ce document ?</DialogTitle>
              <DialogDescription className="mt-1">
                Cette action est irréversible. Le document sera définitivement supprimé.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Vous êtes sur le point de supprimer : <strong className="text-foreground">{documentName}</strong>
          </p>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

