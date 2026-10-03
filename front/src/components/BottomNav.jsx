import { Dumbbell, Home, User } from 'lucide-react'

const items = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'sessions', label: 'Séances', icon: Dumbbell },
  { key: 'account', label: 'Compte', icon: User },
]

export function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--app-border)] bg-[color:var(--app-surface)]/95 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {items.map(({ key, label, icon: Icon }) => {
          const selected = active === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                selected ? 'theme-accent' : 'theme-muted'
              }`}
            >
              <Icon className={`h-[21px] w-[21px] ${selected ? 'stroke-[2.4]' : 'stroke-2'}`} />
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
