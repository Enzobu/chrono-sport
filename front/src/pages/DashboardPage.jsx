import { Dumbbell } from 'lucide-react'
import { Button } from '../components/ui/button'

function getSuggestedSession(history, sessions) {
  if (history.length < 3) return null
  const chronological = [...history].reverse()
  const latest = history[0]?.sessionName
  if (!latest) return null

  const counts = new Map()
  for (let index = 0; index < chronological.length - 1; index += 1) {
    const current = chronological[index]?.sessionName
    const next = chronological[index + 1]?.sessionName
    if (current === latest && next && sessions[next]) {
      counts.set(next, (counts.get(next) ?? 0) + 1)
    }
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

export function DashboardPage({ sessions, history = [], onOpenSessions, onOpenSession }) {
  const count = Object.keys(sessions).length
  const suggestion = getSuggestedSession(history, sessions)
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pt-12">
      <p className="theme-accent text-xs font-black uppercase tracking-[0.22em]">Chrono-Sport</p>
      <h1 className="theme-text mt-2 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Accueil</h1>
      <p className="theme-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base">
        Ton tableau de bord pour lancer rapidement la prochaine séance.
      </p>

      <section className="theme-surface mt-8 rounded-[1.7rem] border p-6">
        <p className="theme-accent text-xs font-black uppercase tracking-[0.16em]">À suivre</p>
        {suggestion ? (
          <>
            <h2 className="theme-text mt-2 text-3xl font-black capitalize">{suggestion}</h2>
            <p className="theme-muted mt-2 text-sm">Basé sur l'ordre de tes séances réellement terminées.</p>
            <Button className="theme-primary mt-5 rounded-2xl font-black" onClick={() => onOpenSession(suggestion)}>
              <Dumbbell className="h-4 w-4" /> Lancer la séance
            </Button>
          </>
        ) : (
          <>
            <h2 className="theme-text mt-2 text-2xl font-black">Pas encore assez d'historique</h2>
            <p className="theme-muted mt-2 text-sm">Après quelques cycles, Chrono-Sport pourra te proposer la suite la plus probable.</p>
            <Button className="theme-primary mt-5 rounded-2xl font-black" onClick={onOpenSessions}>
              <Dumbbell className="h-4 w-4" /> Voir mes séances
            </Button>
          </>
        )}
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <section className="theme-surface rounded-[1.7rem] border p-6">
          <p className="theme-muted text-xs font-bold uppercase tracking-[0.14em]">Programme</p>
          <div className="theme-text mt-2 text-3xl font-black">{count}</div>
          <p className="theme-muted mt-1 text-sm">séance{count > 1 ? 's' : ''} disponible{count > 1 ? 's' : ''}</p>
        </section>
        <section className="theme-surface rounded-[1.7rem] border p-6">
          <p className="theme-muted text-xs font-bold uppercase tracking-[0.14em]">Progression</p>
          <div className="theme-text mt-2 text-3xl font-black">{history.length}</div>
          <p className="theme-muted mt-1 text-sm">séance{history.length > 1 ? 's' : ''} terminée{history.length > 1 ? 's' : ''}</p>
        </section>
      </div>
    </main>
  )
}
