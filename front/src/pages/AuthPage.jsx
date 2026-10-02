import { Activity } from 'lucide-react'
import { Button } from '../components/ui/button'

export function AuthPage({
  authMode,
  authEmail,
  authPassword,
  authError,
  sessionsError,
  isAuthLoading,
  onSubmit,
  onAuthModeToggle,
  onEmailChange,
  onPasswordChange,
}) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md items-center px-4 py-10">
      <section className="theme-surface w-full rounded-[1.8rem] border p-6 sm:p-7">
        <div className="mb-7">
          <div className="theme-accent-soft theme-accent mb-5 flex h-12 w-12 items-center justify-center rounded-2xl">
            <Activity className="h-6 w-6" />
          </div>
          <p className="theme-accent text-xs font-black uppercase tracking-[0.2em]">Chrono-Sport</p>
          <h1 className="theme-text mt-2 text-3xl font-black tracking-tight">
            {authMode === 'login' ? 'Connexion' : 'Inscription'}
          </h1>
          <p className="theme-muted mt-2 text-sm leading-6">
            Retrouve tes séances, ton chrono et ton rythme.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="theme-text text-sm font-bold" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={authEmail}
              onChange={(event) => onEmailChange(event.target.value)}
              className="theme-panel theme-text h-12 w-full rounded-2xl border px-4 text-sm outline-none placeholder:opacity-50 focus:border-[var(--brand)]"
              placeholder="toi@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="theme-text text-sm font-bold" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={authPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              className="theme-panel theme-text h-12 w-full rounded-2xl border px-4 text-sm outline-none placeholder:opacity-50 focus:border-[var(--brand)]"
              placeholder="8 caractères minimum"
            />
          </div>

          {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
          {sessionsError ? <p className="text-sm text-red-400">{sessionsError}</p> : null}

          <Button
            type="submit"
            className="theme-primary h-12 w-full rounded-2xl font-black text-white hover:opacity-90"
            disabled={isAuthLoading}
          >
            {isAuthLoading
              ? 'Chargement...'
              : authMode === 'login'
                ? 'Se connecter'
                : "S'inscrire"}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="theme-muted mt-3 w-full rounded-2xl hover:bg-[var(--app-panel-alt)] hover:text-[var(--app-text)]"
          onClick={onAuthModeToggle}
        >
          {authMode === 'login'
            ? 'Pas de compte ? Créer un compte'
            : 'Déjà un compte ? Se connecter'}
        </Button>
      </section>
    </main>
  )
}
