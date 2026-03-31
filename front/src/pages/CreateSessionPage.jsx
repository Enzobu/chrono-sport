import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
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
  onSetFieldChange,
  onRemoveSet,
  onAddSet,
  onAddExercise,
}) {
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
        {draftExercises.map((exercise, exerciseIndex) => (
          <Card key={`exercise-${exerciseIndex}`} className="border-white/10 bg-black/60">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-white">Exercice {exerciseIndex + 1}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                  onClick={() => onRemoveExercise(exerciseIndex)}
                >
                  <Trash2 className="h-4 w-4" /> Supprimer
                </Button>
              </div>
              <input
                value={exercise.name}
                onChange={(event) => onExerciseNameChange(exerciseIndex, event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-zinc-500"
                placeholder="Nom de l'exercice"
              />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-zinc-800">
                <div className="hidden grid-cols-[1.2fr_1fr_1fr_auto] gap-3 border-b border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs uppercase tracking-wide text-zinc-400 md:grid">
                  <span>Type</span>
                  <span>Duree (s)</span>
                  <span>Repos (s)</span>
                  <span></span>
                </div>
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={`set-${setIndex}`}
                    className="grid gap-3 border-b border-zinc-900 px-3 py-3 last:border-b-0 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-end md:py-2"
                  >
                    <label className="space-y-1 text-xs text-zinc-400 md:space-y-0 md:text-[0px]">
                      <span className="md:hidden">Type</span>
                      <div className="grid h-9 grid-cols-2 rounded-md border border-zinc-700 bg-zinc-950 p-1">
                        <button
                          type="button"
                          onClick={() => onSetFieldChange(exerciseIndex, setIndex, 'type', 'entrainement')}
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
                          onClick={() => onSetFieldChange(exerciseIndex, setIndex, 'type', 'echauffement')}
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
                          onSetFieldChange(exerciseIndex, setIndex, 'time', event.target.value)
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
                          onSetFieldChange(exerciseIndex, setIndex, 'wait', event.target.value)
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
                ))}
              </div>

              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                  onClick={() => onAddSet(exerciseIndex)}
                >
                  <Plus className="h-4 w-4" /> Ajouter une serie
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
          onClick={onAddExercise}
        >
          <Plus className="h-4 w-4" /> Ajouter un exercice
        </Button>
      </div>

      {draftError ? <p className="mt-4 text-sm text-red-400">{draftError}</p> : null}
    </main>
  )
}
