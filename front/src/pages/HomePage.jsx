import { Plus } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { SessionCard } from '../components/SessionCard'

export function HomePage({
  sessions,
  sessionsError,
  isLoadingSessions,
  onOpenCreate,
  onLogout,
  onOpenSession,
  onEditSession,
  onDeleteSession,
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="mb-10 space-y-4">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
            onClick={onOpenCreate}
          >
            <Plus className="h-4 w-4" /> Nouvelle seance
          </Button>
          <Button
            variant="outline"
            className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
            onClick={onLogout}
          >
            Deconnexion
          </Button>
        </div>
        <Badge variant="outline" className="w-fit border-white/20 bg-white/5 uppercase tracking-[0.18em]">
          Minuteur Sport
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Choisis ta seance
        </h1>
        {sessionsError ? <p className="text-sm text-red-400">{sessionsError}.</p> : null}
      </div>

      {isLoadingSessions ? (
        <div className="rounded-xl border border-white/10 bg-black/50 p-6 text-zinc-300">
          Chargement des seances...
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.keys(sessions).map((sessionName) => (
          <SessionCard
            key={sessionName}
            sessionName={sessionName}
            sessionData={sessions[sessionName]}
            onOpen={onOpenSession}
            onEdit={onEditSession}
            onDelete={onDeleteSession}
          />
        ))}
      </div>

      {!isLoadingSessions && !Object.keys(sessions).length ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-6 text-zinc-300">
          Aucune seance en base pour cet utilisateur.
        </div>
      ) : null}
    </main>
  )
}
