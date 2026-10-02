import { CheckCircle2, Clock3, Dumbbell, ListChecks } from 'lucide-react'
import { Button } from '../components/ui/button'
import { formatHoursMinutesSeconds } from '../lib/timer'

export function WorkoutSummaryPage({ sessionName, durationSeconds, exercises, sets, finishedAt, onDone }) {
  const stats = [
    ['Durée réelle', formatHoursMinutesSeconds(durationSeconds), Clock3],
    ['Exercices', exercises, Dumbbell],
    ['Séries', sets, ListChecks],
  ]
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-4 py-8 sm:px-6">
      <section className="theme-surface w-full rounded-[2rem] border p-6 sm:p-8">
        <div className="theme-accent-soft theme-accent mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <p className="theme-accent mt-5 text-center text-xs font-black uppercase tracking-[0.18em]">Séance terminée</p>
        <h1 className="theme-text mt-2 text-center text-3xl font-black capitalize sm:text-4xl">{sessionName}</h1>
        <p className="theme-muted mt-2 text-center text-sm">
          Terminée à {new Date(finishedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {stats.map(([label, value, Icon]) => (
            <div key={label} className="theme-panel rounded-2xl border p-4 text-center">
              <Icon className="theme-accent mx-auto h-5 w-5" />
              <div className="theme-text mt-2 text-2xl font-black">{value}</div>
              <div className="theme-muted mt-1 text-xs">{label}</div>
            </div>
          ))}
        </div>
        <Button className="theme-primary mt-7 h-12 w-full rounded-2xl font-black" onClick={onDone}>Retour à l'accueil</Button>
      </section>
    </main>
  )
}
