export function ToastBanner({ toast }) {
  if (!toast) {
    return null
  }

  const baseClass =
    'fixed bottom-4 right-4 z-[60] rounded-md border px-4 py-3 text-sm shadow-lg backdrop-blur'
  const colorClass =
    toast.type === 'success'
      ? 'border-emerald-800 bg-emerald-950/90 text-emerald-100'
      : 'border-red-800 bg-red-950/90 text-red-100'

  return <div className={`${baseClass} ${colorClass}`}>{toast.message}</div>
}
