import { useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export function CreateSessionPage({
  editingSessionId,
  draftSessionName,
  draftExercises,
  draftError,
  isSavingDraft,
  onBack,
  onSave,
  onSessionNameChange,
  onExerciseNameChange,
  onRemoveExercise,
  onMoveExercise,
  onInsertExercise,
  onSetFieldChange,
  onRemoveSet,
  onAddSet,
  onAddExercise,
}) {
  const [expandedExercises, setExpandedExercises] = useState(
    () => new Set(editingSessionId ? [] : [0]),
  )
  const [expandedSets, setExpandedSets] = useState(() => new Set())

  const setAccordionKey = (exerciseIndex, setIndex) => `${exerciseIndex}-${setIndex}`

  const toggleExercise = (exerciseIndex) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseIndex)) {
        next.delete(exerciseIndex)
      } else {
        next.add(exerciseIndex)
      }
      return next
    })
  }

  const toggleSet = (exerciseIndex, setIndex) => {
    const key = setAccordionKey(exerciseIndex, setIndex)
    setExpandedSets((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleAddSet = (exerciseIndex) => {
    const newSetIndex = draftExercises[exerciseIndex]?.sets.length ?? 0
    onAddSet(exerciseIndex)
    setExpandedExercises((prev) => new Set(prev).add(exerciseIndex))
    setExpandedSets((prev) => new Set(prev).add(setAccordionKey(exerciseIndex, newSetIndex)))
  }

  const handleAddExercise = () => {
    const newExerciseIndex = draftExercises.length
    onAddExercise()
    setExpandedExercises(new Set([newExerciseIndex]))
    setExpandedSets(new Set())
  }

  const handleInsertExercise = (exerciseIndex) => {
    onInsertExercise(exerciseIndex)
    setExpandedExercises(new Set([exerciseIndex]))
    setExpandedSets(new Set())
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Button
          className="bg-white text-black hover:bg-zinc-100"
          onClick={onSave}
          disabled={isSavingDraft}
        >
          <Save className="h-4 w-4" />
          {isSavingDraft
            ? 'Enregistrement...'
            : editingSessionId
              ? 'Mettre a jour la seance'
              : 'Enregistrer la seance'}
        </Button>
      </div>

      <Card className="mb-6 border-white/10 bg-black/60">
        <CardHeader>
          <CardTitle className="text-white">
            {editingSessionId ? 'Modifier la seance' : 'Nouvelle seance'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Definis le nom, les exercices et les series.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="mb-2 block text-sm text-zinc-300" htmlFor="session-name">
            Nom de la seance
          </label>
          <input
            id="session-name"
            value={draftSessionName}
            onChange={(event) => onSessionNameChange(event.target.value)}
            className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-500"
            placeholder="ex: Push volume"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {draftExercises.map((exercise, exerciseIndex) => {
          const exerciseExpanded = expandedExercises.has(exerciseIndex)

          return (
            <div key={`exercise-${exerciseIndex}`} className="space-y-3">
              <Card className="border-white/10 bg-black/60">
                <CardHeader className={exerciseExpanded ? 'pb-4' : 'py-3'}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => toggleExercise(exerciseIndex)}
                    >
                      {exerciseExpanded ? (
                        <ChevronUp className="h-5 w-5 shrink-0 text-zinc-300" />
                      ) : (
                        <ChevronDown className="h-5 w-5 shrink-0 text-zinc-300" />
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base text-white sm:text-lg">
                          {exercise.name.trim() || `Exercice ${exerciseIndex + 1}`}
                        </CardTitle>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          Exercice {exerciseIndex + 1} · {exercise.sets.length} série
                          {exercise.sets.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
                        onClick={() => onMoveExercise(exerciseIndex, -1)}
                        disabled={exerciseIndex === 0}
                        aria-label="Monter l'exercice"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
                        onClick={() => onMoveExercise(exerciseIndex, 1)}
                        disabled={exerciseIndex === draftExercises.length - 1}
                        aria-label="Descendre l'exercice"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {exerciseExpanded ? (
                    <input
                      value={exercise.name}
                      onChange={(event) => onExerciseNameChange(exerciseIndex, event.target.value)}
                      className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-500"
                      placeholder="Nom de l'exercice"
                    />
                  ) : null}
                </CardHeader>

                {exerciseExpanded ? (
                  <CardContent>
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => {
                        const setKey = setAccordionKey(exerciseIndex, setIndex)
                        const setExpanded = expandedSets.has(setKey)

                        return (
                          <div
                            key={`set-${setIndex}`}
                            className="overflow-hidden rounded-md border border-zinc-800 bg-zinc-950/70"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-zinc-900/60"
                              onClick={() => toggleSet(exerciseIndex, setIndex)}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-white">
                                  Série {setIndex + 1}
                                  {set.type === 'echauffement' ? ' · Échauffement' : ''}
                                </div>
                                <div className="mt-0.5 text-xs text-zinc-400">
                                  {set.time}s · repos {set.wait}s · {Number(set.weight) || 0}kg
                                </div>
                              </div>
                              {setExpanded ? (
                                <ChevronUp className="h-4 w-4 shrink-0 text-zinc-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
                              )}
                            </button>

                            {setExpanded ? (
                              <div className="grid gap-3 border-t border-zinc-800 px-3 py-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-end">
                                <label className="space-y-1 text-xs text-zinc-400 md:space-y-0 md:text-[0px]">
                                  <span className="md:hidden">Type</span>
                                  <div className="grid h-9 grid-cols-2 rounded-md border border-zinc-700 bg-zinc-950 p-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSetFieldChange(
                                          exerciseIndex,
                                          setIndex,
                                          'type',
                                          'entrainement',
                                        )
                                      }
                                      className={`rounded text-xs font-medium transition ${
                                        set.type === 'entrainement'
                                          ? 'bg-zinc-200 text-zinc-900'
                                          : 'text-zinc-300 hover:bg-zinc-900'
                                      }`}
                                    >
                                      entrainement
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onSetFieldChange(
                                          exerciseIndex,
                                          setIndex,
                                          'type',
                                          'echauffement',
                                        )
                                      }
                                      className={`rounded text-xs font-medium transition ${
                                        set.type === 'echauffement'
                                          ? 'bg-zinc-200 text-zinc-900'
                                          : 'text-zinc-300 hover:bg-zinc-900'
                                      }`}
                                    >
                                      echauffement
                                    </button>
                                  </div>
                                </label>

                                <label className="space-y-1 text-xs text-zinc-400 md:space-y-0 md:text-[0px]">
                                  <span className="md:hidden">Duree (s)</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={set.time}
                                    onChange={(event) =>
                                      onSetFieldChange(
                                        exerciseIndex,
                                        setIndex,
                                        'time',
                                        event.target.value,
                                      )
                                    }
                                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                                  />
                                </label>

                                <label className="space-y-1 text-xs text-zinc-400 md:space-y-0 md:text-[0px]">
                                  <span className="md:hidden">Repos (s)</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={set.wait}
                                    onChange={(event) =>
                                      onSetFieldChange(
                                        exerciseIndex,
                                        setIndex,
                                        'wait',
                                        event.target.value,
                                      )
                                    }
                                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                                  />
                                </label>

                                <label className="space-y-1 text-xs text-zinc-400 md:space-y-0 md:text-[0px]">
                                  <span className="md:hidden">Poids (kg)</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step="0.5"
                                    value={set.weight}
                                    onChange={(event) =>
                                      onSetFieldChange(
                                        exerciseIndex,
                                        setIndex,
                                        'weight',
                                        event.target.value,
                                      )
                                    }
                                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                                  />
                                </label>

                                <div className="flex justify-end md:block">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                    onClick={() => onRemoveSet(exerciseIndex, setIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                        onClick={() => handleAddSet(exerciseIndex)}
                      >
                        <Plus className="h-4 w-4" /> Ajouter une serie
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-950 bg-black text-red-300 hover:bg-red-950/30 hover:text-red-200"
                        onClick={() => onRemoveExercise(exerciseIndex)}
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer l'exercice
                      </Button>
                    </div>
                  </CardContent>
                ) : null}
              </Card>

              {exerciseIndex < draftExercises.length - 1 ? (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-dashed border-zinc-700 bg-black text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    onClick={() => handleInsertExercise(exerciseIndex + 1)}
                  >
                    <Plus className="h-4 w-4" /> Ajouter ici
                  </Button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
          onClick={handleAddExercise}
        >
          <Plus className="h-4 w-4" /> Ajouter un exercice
        </Button>
      </div>

      {draftError ? <p className="mt-4 text-sm text-red-400">{draftError}</p> : null}
    </main>
  )
}
