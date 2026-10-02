import { Dumbbell, Home, User } from 'lucide-react'

const items = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'sessions', label: 'Séances', icon: Dumbbell },
  { key: 'account', label: 'Compte', icon: User },
]

export function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--app-border)] bg-[color:var(--app-surface)]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
        {items.map(({ key, label, icon: Icon }) => {
          const selected = active === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition ${
                selected ? 'theme-accent-soft theme-accent' : 'theme-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
