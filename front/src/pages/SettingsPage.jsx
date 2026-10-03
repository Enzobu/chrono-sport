import { useState } from 'react'
import { Check, LogOut, Monitor, Moon, RotateCcw, Sun } from 'lucide-react'
import { Button } from '../components/ui/button'

const accents = {
  blue: '#5B8CFF',
  violet: '#8B7CFF',
  emerald: '#22C98A',
  orange: '#FF9F43',
  rose: '#FF5C8A',
  cyan: '#24C7D9',
}

const modes = [
  { key: 'system', label: 'Système', description: 'Suit automatiquement ton appareil', icon: Monitor },
  { key: 'light', label: 'Clair', description: 'Interface claire en permanence', icon: Sun },
  { key: 'dark', label: 'Sombre', description: 'Interface sombre en permanence', icon: Moon },
]

export function SettingsPage({ themeMode, accent, resolvedTheme, onThemeModeChange, onAccentChange, onLogout, weightUnit = 'kg', onWeightUnitChange, workoutSoundEnabled = true, onWorkoutSoundChange, history = [], isLoadingHistory = false }) {
  const [confirmAppearanceReset, setConfirmAppearanceReset] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  const resetAppearance = () => {
    onThemeModeChange('system')
    onAccentChange('blue')
    setConfirmAppearanceReset(false)
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-28 pt-8 sm:px-6 lg:pt-12">
      <div className="mb-8">
        <p className="theme-accent text-xs font-black uppercase tracking-[0.2em]">Compte</p>
        <h1 className="theme-text mt-1 text-4xl font-black tracking-tight">Compte & réglages</h1>
        <p className="theme-muted mt-2">Personnalise l'app et gère ton compte.</p>
      </div>

      <section className="mb-3 mt-2">
        <p className="theme-accent text-xs font-black uppercase tracking-[0.18em]">Compte</p>
        <p className="theme-muted mt-1 text-sm">Ton activité et les actions liées à ton compte.</p>
      </section>
      <section className="theme-surface mt-4 rounded-[1.6rem] border p-5 sm:p-6">
        <h2 className="theme-text text-xl font-black">Historique</h2>
        <p className="theme-muted mt-1 text-sm">Tes dernières séances terminées.</p>
        <div className="mt-4 space-y-2">
          {isLoadingHistory ? <p className="theme-muted text-sm">Chargement...</p> : null}
          {!isLoadingHistory && !history.length ? <p className="theme-muted text-sm">Aucune séance terminée pour le moment.</p> : null}
          {(historyExpanded ? history : history.slice(0, 5)).map((entry) => (
            <div key={entry.id} className="theme-panel flex items-center justify-between rounded-2xl border p-3">
              <div>
                <div className="theme-text font-bold">{entry.sessionName}</div>
                <div className="theme-muted text-xs">{new Date(entry.finishedAt).toLocaleString('fr-FR')}</div>
              </div>
              <div className="theme-accent text-sm font-black">{Math.floor(entry.durationSeconds / 60)} min</div>
            </div>
          ))}
        </div>
        {history.length > 5 ? (
          <button type="button" className="theme-outline mt-4 w-full rounded-2xl border px-4 py-3 text-sm font-black" onClick={() => setHistoryExpanded((value) => !value)}>
            {historyExpanded ? 'Réduire l’historique' : `Afficher tout l’historique (${history.length})`}
          </button>
        ) : null}
      </section>

      <section className="mb-3 mt-8">
        <p className="theme-accent text-xs font-black uppercase tracking-[0.18em]">Paramètres</p>
        <p className="theme-muted mt-1 text-sm">Préférences et personnalisation de l’application.</p>
      </section>
      <section className="theme-surface rounded-[1.6rem] border p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="theme-text text-xl font-black">Apparence</h2>
          <p className="theme-muted mt-1 text-sm">
            Mode actif : {resolvedTheme === 'dark' ? 'sombre' : 'clair'}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {modes.map(({ key, label, description, icon: Icon }) => {
            const active = themeMode === key
            return (
              <button
                type="button"
                key={key}
                onClick={() => onThemeModeChange(key)}
                className={`theme-panel flex min-h-28 items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  active ? 'theme-accent-border theme-accent-soft' : ''
                }`}
              >
                <div className="theme-icon-box">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="theme-text font-bold">{label}</div>
                  <div className="theme-muted mt-1 text-xs leading-5">{description}</div>
                </div>
                {active ? <Check className="theme-accent h-4 w-4 shrink-0" /> : null}
              </button>
            )
          })}
        </div>
      </section>

      <section className="theme-surface mt-4 rounded-[1.6rem] border p-5 sm:p-6">
        <h2 className="theme-text text-xl font-black">Couleur primaire</h2>
        <p className="theme-muted mt-1 text-sm">Actions, progression et accents visuels.</p>

        <div className="mt-5 flex flex-wrap gap-4">
          {Object.entries(accents).map(([key, color]) => {
            const active = accent === key
            return (
              <button
                type="button"
                key={key}
                onClick={() => onAccentChange(key)}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border-[3px] transition ${
                    active ? 'theme-swatch-active' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {active ? <Check className="h-6 w-6 text-white" /> : null}
                </span>
                <span className={active ? 'theme-text text-xs font-bold' : 'theme-muted text-xs'}>
                  {key}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="theme-surface mt-4 rounded-[1.6rem] border p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="theme-text text-xl font-black">Réinitialiser l'apparence</h2>
            <p className="theme-muted mt-1 text-sm">Restaure le thème Système et la couleur bleue par défaut.</p>
          </div>
          <RotateCcw className="theme-muted h-5 w-5 shrink-0" />
        </div>
        {confirmAppearanceReset ? (
          <div className="theme-panel mt-4 rounded-2xl border p-4">
            <p className="theme-text text-sm font-bold">Réinitialiser les réglages visuels ?</p>
            <p className="theme-muted mt-1 text-xs">Le thème et la couleur primaire reviendront aux valeurs par défaut.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="theme-outline flex-1 rounded-2xl" onClick={() => setConfirmAppearanceReset(false)}>Annuler</Button>
              <Button className="theme-primary flex-1 rounded-2xl font-black" onClick={resetAppearance}>Réinitialiser</Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="theme-outline mt-4 rounded-2xl" onClick={() => setConfirmAppearanceReset(true)}>
            <RotateCcw className="h-4 w-4" /> Réinitialiser l'apparence
          </Button>
        )}
      </section>

      <section className="theme-surface mt-4 rounded-[1.6rem] border p-5 sm:p-6">
        <h2 className="theme-text text-xl font-black">Son de séance</h2>
        <p className="theme-muted mt-1 text-sm">Ding joué à la transition repos → travail.</p>
        <button type="button" onClick={() => onWorkoutSoundChange(!workoutSoundEnabled)}
          className={`mt-4 w-full rounded-2xl border px-4 py-3 text-sm font-black ${workoutSoundEnabled ? 'theme-accent-soft theme-accent theme-accent-border' : 'theme-outline theme-muted'}`}>
          {workoutSoundEnabled ? 'Activé' : 'Désactivé'}
        </button>
      </section>

      <section className="theme-surface mt-4 rounded-[1.6rem] border p-5 sm:p-6">
        <h2 className="theme-text text-xl font-black">Unités</h2>
        <p className="theme-muted mt-1 text-sm">Choisis l'unité utilisée pour les poids.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {['kg', 'lb'].map((unit) => (
            <button key={unit} type="button" onClick={() => onWeightUnitChange(unit)}
              className={`rounded-2xl border px-4 py-3 text-sm font-black uppercase ${weightUnit === unit ? 'theme-accent-soft theme-accent theme-accent-border' : 'theme-outline theme-text'}`}>
              {unit}
            </button>
          ))}
        </div>
      </section>

      <section className="theme-preview mt-4 rounded-[1.7rem] border p-6">
        <p className="theme-accent text-xs font-black uppercase tracking-[0.2em]">Aperçu</p>
        <div className="theme-text mt-2 font-mono text-6xl font-black tracking-tight">01:42</div>
        <p className="theme-muted mt-1">Développé incliné • Série 3/4</p>
        <div className="theme-track mt-5 h-2 overflow-hidden rounded-full">
          <div className="theme-primary h-full w-[62%] rounded-full" />
        </div>
        <button type="button" className="theme-primary mt-5 h-12 w-full rounded-2xl font-black text-white">
          Action principale
        </button>
      </section>

      <section className="theme-surface mt-4 rounded-[1.6rem] border p-5 sm:p-6">
        <h2 className="theme-text text-xl font-black">Compte</h2>
        <p className="theme-muted mt-1 text-sm">Déconnexion de ton compte Chrono-Sport.</p>
        <Button variant="outline" className="mt-4 rounded-2xl border-red-950 text-red-300 hover:bg-red-950/30" onClick={onLogout}>
          <LogOut className="h-4 w-4" /> Se déconnecter
        </Button>
      </section>

    </main>
  )
}
