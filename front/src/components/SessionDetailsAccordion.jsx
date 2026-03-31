import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { formatMinutesSeconds } from '../lib/timer'

export function SessionDetailsAccordion({ sessionOutline }) {
  return (
    <Card className="border-white/10 bg-black/60 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Details de la seance</CardTitle>
        <CardDescription className="text-zinc-400">
          Accordions imbriques des exercices et des series, avec etat fait / a faire.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessionOutline.map((exercise, exerciseIndex) => (
          <details
            key={exercise.exerciseName}
            className="rounded-md border border-zinc-800 bg-zinc-950/40"
            open={exercise.hasCurrent || (!exercise.done && exerciseIndex === 0)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm text-white marker:content-none">
              <span className="truncate">{exercise.exerciseName}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${
                  exercise.done
                    ? 'border-emerald-700/70 bg-emerald-950/50 text-emerald-300'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-300'
                }`}
              >
                {exercise.done ? 'Fait' : 'A faire'}
              </span>
            </summary>

            <div className="space-y-2 border-t border-zinc-900 px-3 py-3">
              {exercise.sets.map((set) => (
                <details
                  key={set.key}
                  className="rounded-md border border-zinc-800 bg-black/30"
                  open={set.current}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs text-zinc-200 marker:content-none">
                    <span>
                      Serie {set.order}/{set.total}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 uppercase tracking-wide ${
                        set.done
                          ? 'border-emerald-700/70 bg-emerald-950/40 text-emerald-300'
                          : set.current
                            ? 'border-blue-700/70 bg-blue-950/40 text-blue-300'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-300'
                      }`}
                    >
                      {set.done ? 'Fait' : set.current ? 'En cours' : 'A faire'}
                    </span>
                  </summary>

                  <div className="grid gap-1 border-t border-zinc-900 px-3 py-2 text-xs text-zinc-400 sm:grid-cols-3">
                    <p>Type: {set.type}</p>
                    <p>Travail: {formatMinutesSeconds(set.time)}</p>
                    <p>Repos: {formatMinutesSeconds(set.wait)}</p>
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </CardContent>
    </Card>
  )
}
