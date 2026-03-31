import { cn } from '../../lib/utils'

function Dialog({ open, children }) {
  if (!open) {
    return null
  }

  return children
}

function DialogContent({ className, ...props }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={cn(
          'w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl',
          className,
        )}
        role="dialog"
        aria-modal="true"
        {...props}
      />
    </div>
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('space-y-1.5 text-left', className)} {...props} />
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn('text-lg font-semibold', className)} {...props} />
}

function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function DialogFooter({ className, ...props }) {
  return <div className={cn('mt-5 flex justify-end gap-2', className)} {...props} />
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
