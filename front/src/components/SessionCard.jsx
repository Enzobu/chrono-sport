import { ArrowUpRight, Copy, Pencil, Star, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { createTimeline, formatHoursMinutes } from '../lib/timer'

export function SessionCard({ sessionName, sessionData, favorite = false, onToggleFavorite, onOpen, onEdit, onDuplicate, onDelete }) {
  const exercisesCount = Object.keys(sessionData).length
  const sessionDuration = createTimeline(sessionData).reduce((sum, step) => sum + step.duration, 0)

  return (
    <Card className="theme-surface rounded-[1.5rem] border shadow-none">
      <CardHeader className="relative pb-4">
        <button
          type="button"
          aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`absolute right-5 top-5 rounded-xl p-2 transition ${favorite ? 'theme-accent-soft theme-accent' : 'theme-muted'}`}
          onClick={() => onToggleFavorite(sessionName)}
        >
          <Star className="h-5 w-5" fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl theme-accent-soft theme-accent">
          <ArrowUpRight className="h-5 w-5" />
        </div>
        <CardTitle className="theme-text text-xl font-black capitalize">{sessionName}</CardTitle>
        <CardDescription className="theme-muted">
          {exercisesCount} exercices • {formatHoursMinutes(sessionDuration)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          className="theme-primary h-11 w-full rounded-2xl font-black text-white hover:opacity-90"
          onClick={() => onOpen(sessionName)}
        >
          Lancer la séance
        </Button>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="theme-outline rounded-2xl"
            onClick={() => onEdit(sessionName)}
          >
            <Pencil className="h-4 w-4" /> Modifier
          </Button>
          <Button variant="outline" className="theme-outline rounded-2xl" onClick={() => onDuplicate(sessionName)}>
            <Copy className="h-4 w-4" /> Dupliquer
          </Button>
          <Button
            variant="outline"
            className="rounded-2xl border-red-400/30 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => onDelete(sessionName)}
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
