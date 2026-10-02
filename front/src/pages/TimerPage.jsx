import { ArrowLeft, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { Button } from '../components/ui/button'
import { SessionDetailsAccordion } from '../components/SessionDetailsAccordion'

export function TimerPage({
  selectedSessionName,
  isFinished,
  currentPhase,
  remainingLabel,
  weightOverlayLabel,
  showWeightOverlay,
  displayedExercise,
  exerciseNote,
  displayedPhase,
  progressPct,
  isRunning,
  totalRemainingLabel,
  elapsedLabel,
  completedExercisesCount,
  exerciseCount,
  sessionOutline,
  onBack,
  onToggleRun,
  onSkip,
  onReset,
  onTimerClick,
}) {
  const phaseLabel = isFinished ? 'Terminé' : currentPhase?.label || 'Séance'
  const isWork = !isFinished && currentPhase?.kind === 'work'

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:py-10">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="theme-outline h-12 w-12 rounded-2xl" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="theme-accent text-[11px] font-black uppercase tracking-[0.2em]">{phaseLabel}</p>
          <h1 className="theme-text truncate text-xl font-black">{selectedSessionName}</h1>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <section className={`theme-surface rounded-[1.8rem] border p-5 sm:p-7 ${
          isWork ? 'theme-accent-border' : ''
        }`}>
          <div className="flex items-center justify-between gap-3">
            <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${
              isWork
                ? 'theme-accent-soft theme-accent theme-accent-border'
                : 'theme-panel theme-muted'
            }`}>
              {phaseLabel}
            </span>
            {displayedPhase?.setType === 'echauffement' ? (
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-500">
                Échauffement
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onTimerClick}
            className={`${isWork ? 'theme-work' : 'theme-text'} my-6 w-full select-none bg-transparent text-center font-mono text-6xl font-black tracking-[-0.06em] outline-none transition active:scale-[0.985] sm:text-8xl`}
          >
            {isFinished ? (
              <span className="text-4xl sm:text-5xl">Séance terminée</span>
            ) : (
              <span className="relative block">
                <span className={showWeightOverlay ? 'block opacity-0' : 'block opacity-100'}>
                  {remainingLabel}
                </span>
                <span
                  className={`pointer-events-none absolute inset-0 block transition-opacity duration-300 ${
                    showWeightOverlay ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {weightOverlayLabel ?? ''}
                </span>
              </span>
            )}
          </button>

          <p className="theme-text text-center text-base font-bold sm:text-lg">{displayedExercise}</p>
          {exerciseNote ? (
            <div className="theme-panel mx-auto mt-3 max-w-xl rounded-2xl border px-4 py-3 text-sm">
              <span className="theme-accent font-black">Note · </span>
              <span className="theme-muted">{exerciseNote}</span>
            </div>
          ) : null}

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between text-xs font-bold">
              <span className="theme-muted">Progression</span>
              <span className="theme-accent">{Math.round(progressPct)}%</span>
            </div>
            <div className="theme-track h-2.5 overflow-hidden rounded-full">
              <div
                className="theme-primary h-full rounded-full transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={onToggleRun}
              className="theme-primary h-12 min-w-32 flex-1 rounded-2xl font-black text-white hover:opacity-90"
            >
              {isFinished ? <Play className="h-4 w-4" /> : isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isFinished ? 'Relancer' : isRunning ? 'Pause' : 'Lancer'}
            </Button>
            <Button variant="outline" className="theme-outline h-12 rounded-2xl" onClick={onSkip}>
              <SkipForward className="h-4 w-4" /> Skip
            </Button>
            <Button variant="outline" className="theme-outline h-12 rounded-2xl" onClick={onReset}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <section className="theme-surface rounded-[1.5rem] border p-5 sm:col-span-3 lg:col-span-1">
            <p className="theme-muted text-xs font-bold uppercase tracking-[0.12em]">Temps restant</p>
            <p className="theme-text mt-2 text-2xl font-black tracking-tight">{totalRemainingLabel}</p>
          </section>
          <section className="theme-surface rounded-[1.5rem] border p-5">
            <p className="theme-muted text-xs font-bold uppercase tracking-[0.12em]">Écoulé</p>
            <p className="theme-text mt-2 text-2xl font-black">{elapsedLabel}</p>
          </section>
          <section className="theme-surface rounded-[1.5rem] border p-5">
            <p className="theme-muted text-xs font-bold uppercase tracking-[0.12em]">Exercices</p>
            <p className="theme-text mt-2 text-2xl font-black">{completedExercisesCount}/{exerciseCount}</p>
          </section>
        </div>
      </div>

      <SessionDetailsAccordion sessionOutline={sessionOutline} />
    </main>
  )
}
