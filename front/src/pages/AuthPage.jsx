import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

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
      <Card className="w-full border-white/10 bg-black/70 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur">
        <CardHeader className="space-y-3">
          <Badge variant="outline" className="w-fit border-white/20 bg-white/5 uppercase tracking-[0.18em]">
            Chrono-Sport
          </Badge>
          <CardTitle className="text-2xl text-white">
            {authMode === 'login' ? 'Connexion' : 'Inscription'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Connecte-toi pour retrouver tes seances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm text-zinc-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={authEmail}
                onChange={(event) => onEmailChange(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-zinc-500"
                placeholder="toi@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-300" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={authPassword}
                onChange={(event) => onPasswordChange(event.target.value)}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-zinc-500"
                placeholder="8 caracteres minimum"
              />
            </div>

            {authError ? <p className="text-sm text-red-400">{authError}</p> : null}
            {sessionsError ? <p className="text-sm text-red-400">{sessionsError}</p> : null}

            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-100"
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
            className="mt-3 w-full text-zinc-300 hover:bg-zinc-900 hover:text-white"
            onClick={onAuthModeToggle}
          >
            {authMode === 'login'
              ? "Pas de compte ? Creer un compte"
              : 'Deja un compte ? Se connecter'}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
