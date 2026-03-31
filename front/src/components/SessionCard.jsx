import { Dumbbell, Pencil, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { createTimeline, formatHoursMinutes } from '../lib/timer'

export function SessionCard({ sessionName, sessionData, onOpen, onEdit, onDelete }) {
  const exercisesCount = Object.keys(sessionData).length
  const sessionDuration = createTimeline(sessionData).reduce((sum, step) => sum + step.duration, 0)

  return (
    <Card className="group border-white/10 bg-black/60 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-white capitalize">
          <span>{sessionName}</span>
          <Dumbbell className="h-4 w-4 text-zinc-300" />
        </CardTitle>
        <CardDescription className="text-zinc-500">
          {exercisesCount} exercices - {formatHoursMinutes(sessionDuration)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button className="w-full bg-white text-black hover:bg-zinc-100" onClick={() => onOpen(sessionName)}>
          Lancer la seance
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
            onClick={() => onEdit(sessionName)}
          >
            <Pencil className="h-4 w-4" /> Modifier
          </Button>
          <Button
            variant="outline"
            className="border-red-800/80 bg-black text-red-300 hover:bg-red-950/30 hover:text-red-300"
            onClick={() => onDelete(sessionName)}
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
