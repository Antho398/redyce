/**
 * Modal élégant et réutilisable pour confirmer une suppression
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

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  itemName?: string
  onConfirm: () => Promise<void> | void
  deleting?: boolean
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = 'Supprimer cet élément ?',
  description = 'Cette action est irréversible.',
  itemName,
  onConfirm,
  deleting = false,
  confirmLabel = 'Supprimer',
  cancelLabel = 'Annuler',
}: ConfirmDeleteDialogProps) {
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
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {itemName && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Vous êtes sur le point de supprimer : <strong className="text-foreground">{itemName}</strong>
            </p>
          </div>
        )}
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

