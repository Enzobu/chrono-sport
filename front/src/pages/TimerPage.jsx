import { ArrowLeft, Gauge, Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { SessionDetailsAccordion } from '../components/SessionDetailsAccordion'

export function TimerPage({
  selectedSessionName,
  isFinished,
  currentPhase,
  remainingLabel,
  displayedExercise,
  displayedPhase,
  currentIndex,
  timelineLength,
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
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:py-10">
      <Button
        variant="outline"
        className="w-fit border-white/15 bg-black/40 text-zinc-200 hover:bg-white/10 hover:text-white"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux seances
      </Button>

      <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
        <Card className="border-white/10 bg-black/60 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur">
          <CardHeader className="space-y-6 pb-4">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={
                  currentPhase?.kind === 'rest'
                    ? 'border-zinc-700 bg-zinc-900 text-zinc-200'
                    : 'border-white/20 bg-white/10 text-white'
                }
              >
                {isFinished ? 'Termine' : currentPhase?.label || 'Seance'}
              </Badge>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                Seance {selectedSessionName}
              </Badge>
            </div>
            <CardTitle
              className={`text-center font-mono text-6xl font-semibold tracking-tight sm:text-7xl ${
                !isFinished && currentPhase?.kind === 'work' ? 'text-red-500' : 'text-white'
              }`}
            >
              {isFinished ? 'Seance terminee' : remainingLabel}
            </CardTitle>
            <CardDescription className="text-center text-sm text-zinc-300 sm:text-base">
              Exercice : {displayedExercise}
            </CardDescription>
            {displayedPhase?.setType === 'echauffement' ? (
              <div className="flex justify-center">
                <Badge variant="outline" className="border-amber-700/60 bg-amber-950/40 text-amber-300">
                  Echauffement
                </Badge>
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-zinc-400">
                <span>Progression de la seance</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <Progress className="h-2 bg-zinc-900" value={progressPct} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onToggleRun} className="min-w-28 bg-white text-black hover:bg-zinc-100">
                {isFinished ? (
                  <>
                    <Play className="h-4 w-4" /> Relancer
                  </>
                ) : isRunning ? (
                  <>
                    <Pause className="h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Lancer
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                className="bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                onClick={onSkip}
              >
                <SkipForward className="h-4 w-4" /> Skip
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                onClick={onReset}
              >
                <RotateCcw className="h-4 w-4" /> Reinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/60 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Gauge className="h-4 w-4 text-zinc-300" /> Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-zinc-500">Temps restant global</p>
              <p className="text-2xl font-semibold text-white">{totalRemainingLabel}</p>
            </div>
            <Separator className="bg-zinc-800" />
            <div>
              <p className="text-zinc-500">Depuis le debut</p>
              <p className="text-2xl font-semibold text-white">{elapsedLabel}</p>
            </div>
            <Separator className="bg-zinc-800" />
            <div>
              <p className="text-zinc-500">Exercices</p>
              <p className="text-2xl font-semibold text-white">
                {completedExercisesCount}/{exerciseCount}
              </p>
            </div>
            <Separator className="bg-zinc-800" />
            <div>
              <p className="text-zinc-500">Etapes</p>
              <p className="text-2xl font-semibold text-white">
                {Math.min(currentIndex + 1, timelineLength)}/{timelineLength}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <SessionDetailsAccordion sessionOutline={sessionOutline} />
    </main>
  )
}
