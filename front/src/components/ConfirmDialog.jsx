import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function ConfirmDialog({ open, title, message, confirmLabel, onCancel, onConfirm, hideCancel = false }) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="theme-text">{title}</DialogTitle>
          <DialogDescription className="theme-muted">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {!hideCancel ? (
            <Button
              variant="outline"
              className="theme-outline rounded-xl"
              onClick={onCancel}
            >
              Annuler
            </Button>
          ) : null}
          <Button className="theme-primary rounded-xl font-bold" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
