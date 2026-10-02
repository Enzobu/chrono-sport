import { formatMinutesSeconds } from '../lib/timer'

const formatWeight = (weight) => `${Number(weight) % 1 === 0 ? Number(weight) : Number(weight).toFixed(1)}kg`
const formatRest = (seconds) => formatMinutesSeconds(seconds).replace(/^0(?=\d:)/, '')

export function SessionDetailsAccordion({ sessionOutline }) {
  return (
    <section className="theme-surface rounded-[1.6rem] border p-4 sm:p-5">
      <div className="mb-4">
        <p className="theme-accent text-[10px] font-black uppercase tracking-[0.2em]">Programme</p>
        <h2 className="theme-text mt-1 text-xl font-black">Détails de la séance</h2>
      </div>

      <div className="space-y-2">
        {sessionOutline.map((exercise, exerciseIndex) => (
          <details
            key={exercise.exerciseName}
            className="theme-panel overflow-hidden rounded-2xl border"
            open={exercise.hasCurrent || (!exercise.done && exerciseIndex === 0)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
              <span className="theme-text truncate text-sm font-bold">{exercise.exerciseName}</span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                  exercise.done
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                    : exercise.hasCurrent
                      ? 'theme-accent-border theme-accent-soft theme-accent'
                      : 'theme-muted'
                }`}
              >
                {exercise.done ? 'Fait' : exercise.hasCurrent ? 'En cours' : 'À faire'}
              </span>
            </summary>

            <div className="space-y-2 border-t px-3 py-3" style={{ borderColor: 'var(--app-border)' }}>
              {exercise.sets.map((set) => (
                <details
                  key={set.key}
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: 'var(--app-border)', background: 'var(--app-surface)' }}
                  open={set.current}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 marker:content-none">
                    <span className="theme-text text-xs font-bold">
                      Série {set.order}/{set.total} • {formatWeight(set.weight)} • {formatRest(set.wait)}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                        set.done
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                          : set.current
                            ? 'theme-accent-border theme-accent-soft theme-accent'
                            : 'theme-muted'
                      }`}
                    >
                      {set.done ? 'Fait' : set.current ? 'En cours' : 'À faire'}
                    </span>
                  </summary>

                  <div className="theme-muted grid gap-1 border-t px-3 py-2 text-xs sm:grid-cols-3" style={{ borderColor: 'var(--app-border)' }}>
                    <p>Type : {set.type}</p>
                    <p>Travail : {formatMinutesSeconds(set.time)}</p>
                    <p>Repos : {formatMinutesSeconds(set.wait)}</p>
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
