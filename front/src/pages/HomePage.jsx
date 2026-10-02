import { Search, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../components/ui/button'
import { SessionCard } from '../components/SessionCard'

export function HomePage({
  sessions,
  sessionsError,
  isLoadingSessions,
  onOpenCreate,
  onOpenSession,
  onEditSession,
  onDuplicateSession,
  onDeleteSession,
  sessionItems = [],
  onToggleFavorite,
}) {
  const [query, setQuery] = useState('')
  const visibleSessions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return Object.keys(sessions)
      .filter((name) => !normalized || name.toLowerCase().includes(normalized))
      .sort((a, b) => {
        const aFavorite = Boolean(sessionItems.find((session) => session.name === a)?.favorite)
        const bFavorite = Boolean(sessionItems.find((session) => session.name === b)?.favorite)
        return Number(bFavorite) - Number(aFavorite)
      })
  }, [query, sessions, sessionItems])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pt-12">
      <div className="mb-10">
        <p className="theme-accent text-xs font-black uppercase tracking-[0.22em]">Chrono-Sport</p>
        <h1 className="theme-text mt-2 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
          Séances
        </h1>
        <p className="theme-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base">
          Retrouve, crée et organise toutes tes séances.
        </p>

        <Button
          className="theme-primary mt-6 h-12 rounded-2xl px-5 font-black text-white hover:opacity-90"
          onClick={onOpenCreate}
        >
          <Plus className="h-4 w-4" /> Nouvelle séance
        </Button>
      </div>

      <div className="theme-surface mb-5 flex items-center gap-3 rounded-2xl border px-4">
        <Search className="theme-muted h-4 w-4" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une séance..."
          className="theme-text h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--app-muted)]"
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="theme-text text-xl font-black">Programme</h2>
        <span className="theme-accent-soft theme-accent theme-accent-border rounded-full border px-3 py-1 text-xs font-black">
          {visibleSessions.length}
        </span>
      </div>

      {sessionsError ? <p className="mb-4 text-sm text-red-400">{sessionsError}.</p> : null}

      {isLoadingSessions ? (
        <div className="theme-surface rounded-3xl border p-6 theme-muted">
          Chargement des séances...
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleSessions.map((sessionName) => {
          const item = sessionItems.find((session) => session.name === sessionName)
          return (
          <SessionCard
            key={sessionName}
            sessionName={sessionName}
            sessionData={sessions[sessionName]}
            onOpen={onOpenSession}
            onEdit={onEditSession}
            onDuplicate={onDuplicateSession}
            favorite={Boolean(item?.favorite)}
            onToggleFavorite={onToggleFavorite}
            onDelete={onDeleteSession}
          />
          )
        })}
      </div>

      {!isLoadingSessions && !visibleSessions.length ? (
        <div className="theme-surface mt-4 rounded-3xl border p-6">
          <h3 className="theme-text font-black">{query ? 'Aucun résultat' : 'Aucune séance'}</h3>
          <p className="theme-muted mt-1 text-sm">{query ? 'Essaie avec un autre nom.' : 'Crée ta première séance pour commencer.'}</p>
        </div>
      ) : null}
    </main>
  )
}
