import { Dumbbell } from 'lucide-react'
import { Button } from '../components/ui/button'

export function DashboardPage({ sessions, onOpenSessions }) {
  const count = Object.keys(sessions).length
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pt-12">
      <p className="theme-accent text-xs font-black uppercase tracking-[0.22em]">Chrono-Sport</p>
      <h1 className="theme-text mt-2 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Accueil</h1>
      <p className="theme-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base">
        Ton tableau de bord pour lancer rapidement la prochaine séance.
      </p>

      <section className="theme-surface mt-8 rounded-[1.7rem] border p-6">
        <p className="theme-accent text-xs font-black uppercase tracking-[0.16em]">À suivre</p>
        <h2 className="theme-text mt-2 text-2xl font-black">Ta prochaine séance apparaîtra ici</h2>
        <p className="theme-muted mt-2 text-sm">
          La suggestion sera alimentée par ton historique de séances.
        </p>
        <Button className="theme-primary mt-5 rounded-2xl font-black" onClick={onOpenSessions}>
          <Dumbbell className="h-4 w-4" /> Voir mes séances
        </Button>
      </section>

      <section className="theme-surface mt-4 rounded-[1.7rem] border p-6">
        <p className="theme-muted text-xs font-bold uppercase tracking-[0.14em]">Programme</p>
        <div className="theme-text mt-2 text-3xl font-black">{count}</div>
        <p className="theme-muted mt-1 text-sm">séance{count > 1 ? 's' : ''} disponible{count > 1 ? 's' : ''}</p>
      </section>
    </main>
  )
}
