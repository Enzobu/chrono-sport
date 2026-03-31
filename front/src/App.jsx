import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Gauge,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Dumbbell,
  Plus,
  Trash2,
  Save,
  Pencil,
} from 'lucide-react'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog'
import { Progress } from './components/ui/progress'
import { Separator } from './components/ui/separator'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function safeJson(response) {
  try {
    return await response.json()
  } catch {
    return {}
  }
}

function formatHoursMinutes(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const totalMinutes = Math.floor(safeSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function formatMinutesSeconds(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatTimerValue(seconds) {
  return formatHoursMinutes(seconds)
}

function formatElapsed(seconds) {
  return formatHoursMinutes(seconds)
}

function createTimeline(session) {
  const exerciseEntries = Object.entries(session)

  return exerciseEntries.flatMap(([exerciseName, sets], exerciseIndex) => {
    const isLastExercise = exerciseIndex === exerciseEntries.length - 1

    return sets.flatMap((set, setIndex) => {
      const isLastSet = setIndex === sets.length - 1
      const isLastBlock = isLastExercise && isLastSet
      const setType = set.type === 'echauffement' ? 'echauffement' : 'entrainement'
      const work = {
        kind: 'work',
        label: 'Travail',
        duration: Number(set.time) || 0,
        exerciseName,
        setNumber: setIndex + 1,
        setTotal: sets.length,
        setType,
      }

      if (isLastBlock || !(Number(set.wait) > 0)) {
        return [work]
      }

      return [
        work,
        {
          kind: 'rest',
          label: 'Repos',
          duration: Number(set.wait),
          exerciseName,
          setNumber: setIndex + 1,
          setTotal: sets.length,
          setType,
        },
      ]
    })
  })
}

function mapApiSessionsToClient(apiSessions) {
  return (apiSessions ?? []).reduce((acc, session) => {
    const exercises = (session.exercises ?? []).reduce((exerciseAcc, exercise) => {
      exerciseAcc[exercise.name] = (exercise.sets ?? []).map((set) => ({
        type: set.type,
        time: Number(set.time) || 0,
        wait: Number(set.wait) || 0,
      }))
      return exerciseAcc
    }, {})

    acc[session.name] = exercises
    return acc
  }, {})
}

async function fetchSessionsFromApi(token) {
  const sessionsResponse = await fetch(`${API_URL}/sessions`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (sessionsResponse.status === 401) {
    throw new Error('401')
  }

  if (!sessionsResponse.ok) {
    throw new Error('Impossible de recuperer les seances')
  }

  const payload = await safeJson(sessionsResponse)
  return payload.sessions ?? []
}

function createDefaultSet() {
  return {
    type: 'entrainement',
    time: 60,
    wait: 180,
  }
}

function createDefaultExercise() {
  return {
    name: '',
    sets: [createDefaultSet()],
  }
}

function ToastBanner({ toast }) {
  if (!toast) {
    return null
  }

  const baseClass =
    'fixed bottom-4 right-4 z-[60] rounded-md border px-4 py-3 text-sm shadow-lg backdrop-blur'
  const colorClass =
    toast.type === 'success'
      ? 'border-emerald-800 bg-emerald-950/90 text-emerald-100'
      : 'border-red-800 bg-red-950/90 text-red-100'

  return <div className={`${baseClass} ${colorClass}`}>{toast.message}</div>
}

function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('auth_token') ?? '')
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [sessionItems, setSessionItems] = useState([])
  const [sessions, setSessions] = useState({})
  const [isLoadingSessions, setIsLoadingSessions] = useState(true)
  const [sessionsError, setSessionsError] = useState('')
  const [isCreateMode, setIsCreateMode] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [draftSessionName, setDraftSessionName] = useState('')
  const [draftExercises, setDraftExercises] = useState([createDefaultExercise()])
  const [draftError, setDraftError] = useState('')
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [selectedSessionName, setSelectedSessionName] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [nowTimestamp, setNowTimestamp] = useState(Date.now())
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [sessionPendingDelete, setSessionPendingDelete] = useState(null)
  const [toast, setToast] = useState(null)
  const audioContextRef = useRef(null)

  const showToast = (type, message) => {
    setToast({ type, message, id: Date.now() })
  }

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 2600)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const refreshSessions = async (token, { showLoading = false } = {}) => {
    if (!token) {
      setSessions({})
      setSessionItems([])
      return
    }

    if (showLoading) {
      setIsLoadingSessions(true)
    }

    setSessionsError('')

    const apiSessions = await fetchSessionsFromApi(token)
    setSessionItems(apiSessions)
    setSessions(mapApiSessionsToClient(apiSessions))
  }

  useEffect(() => {
    let cancelled = false

    const fetchSessions = async () => {
      if (!authToken) {
        setIsLoadingSessions(false)
        setSessions({})
        setSessionItems([])
        setSessionsError('')
        return
      }

      setIsLoadingSessions(true)
      try {
        await refreshSessions(authToken)
      } catch (error) {
        if (error?.message?.includes('401')) {
          localStorage.removeItem('auth_token')
          if (!cancelled) {
            setAuthToken('')
            setSessions({})
            setSessionItems([])
            setSessionsError('Session expiree, reconnecte-toi.')
          }
          return
        }

        if (!cancelled) {
          setSessionsError(error.message || 'Erreur de chargement des seances')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSessions(false)
        }
      }
    }

    fetchSessions()

    return () => {
      cancelled = true
    }
  }, [authToken])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setIsAuthLoading(true)
    setAuthError('')

    try {
      const endpoint = authMode === 'register' ? 'register' : 'login'
      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
        }),
      })

      const payload = await safeJson(response)

      if (!response.ok || !payload.token) {
        throw new Error(payload.message || 'Echec de connexion')
      }

      localStorage.setItem('auth_token', payload.token)
      setAuthToken(payload.token)
      setAuthPassword('')
    } catch (error) {
      setAuthError(error.message || 'Erreur de connexion')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setAuthToken('')
    setSessions({})
    setSessionItems([])
    setIsCreateMode(false)
    setEditingSessionId(null)
    setSelectedSessionName(null)
    setSessionsError('')
    setHasStarted(false)
    setIsRunning(false)
  }

  const resetDraft = () => {
    setEditingSessionId(null)
    setDraftSessionName('')
    setDraftExercises([createDefaultExercise()])
    setDraftError('')
  }

  const openCreateMode = () => {
    resetDraft()
    setIsCreateMode(true)
    setSelectedSessionName(null)
  }

  const closeCreateMode = () => {
    setIsCreateMode(false)
    setDraftError('')
  }

  const openEditMode = (sessionName) => {
    const target = sessionItems.find((session) => session.name === sessionName)
    if (!target) {
      return
    }

    setEditingSessionId(target.id)
    setDraftSessionName(target.name)
    setDraftExercises(
      (target.exercises ?? []).map((exercise) => ({
        name: exercise.name,
        sets: (exercise.sets ?? []).map((set) => ({
          type: set.type,
          time: Number(set.time) || 60,
          wait: Number(set.wait) || 0,
        })),
      })),
    )
    setDraftError('')
    setSelectedSessionName(null)
    setIsCreateMode(true)
  }

  const askDeleteSession = (sessionName) => {
    const target = sessionItems.find((session) => session.name === sessionName)
    if (!target) {
      return
    }

    setSessionPendingDelete({ id: target.id, name: target.name })
    setPendingAction('delete-session')
    setIsConfirmOpen(true)
  }

  const updateExerciseName = (exerciseIndex, value) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, name: value } : exercise,
      ),
    )
  }

  const addExercise = () => {
    setDraftExercises((prev) => [...prev, createDefaultExercise()])
  }

  const removeExercise = (exerciseIndex) => {
    setDraftExercises((prev) => prev.filter((_, index) => index !== exerciseIndex))
  }

  const addSet = (exerciseIndex) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) =>
        index === exerciseIndex
          ? { ...exercise, sets: [...exercise.sets, createDefaultSet()] }
          : exercise,
      ),
    )
  }

  const removeSet = (exerciseIndex, setIndex) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise
        }

        const nextSets = exercise.sets.filter((_, idx) => idx !== setIndex)
        return {
          ...exercise,
          sets: nextSets.length ? nextSets : [createDefaultSet()],
        }
      }),
    )
  }

  const updateSetField = (exerciseIndex, setIndex, field, value) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise
        }

        return {
          ...exercise,
          sets: exercise.sets.map((set, idx) => {
            if (idx !== setIndex) {
              return set
            }

            if (field === 'type') {
              return { ...set, type: value }
            }

            const numericValue = Number(value)
            return {
              ...set,
              [field]: Number.isFinite(numericValue)
                ? Math.max(field === 'wait' ? 0 : 1, Math.floor(numericValue))
                : field === 'wait'
                  ? 0
                  : 1,
            }
          }),
        }
      }),
    )
  }

  const validateDraft = () => {
    if (!draftSessionName.trim()) {
      return 'Le nom de la seance est obligatoire.'
    }

    if (!draftExercises.length) {
      return 'Ajoute au moins un exercice.'
    }

    for (const exercise of draftExercises) {
      if (!exercise.name.trim()) {
        return 'Chaque exercice doit avoir un nom.'
      }

      if (!exercise.sets.length) {
        return `L'exercice ${exercise.name} doit avoir au moins une serie.`
      }

      for (const set of exercise.sets) {
        if (set.time < 1 || set.wait < 0) {
          return 'Chaque serie doit avoir une duree >= 1 et un repos >= 0.'
        }
      }
    }

    return ''
  }

  const saveDraftSession = async () => {
    const validationError = validateDraft()
    if (validationError) {
      setDraftError(validationError)
      return
    }

    if (!authToken) {
      setDraftError('Tu dois etre connecte.')
      return
    }

    setIsSavingDraft(true)
    setDraftError('')

    try {
      const payload = {
        name: draftSessionName.trim(),
        exercises: draftExercises.map((exercise) => ({
          name: exercise.name.trim(),
          sets: exercise.sets.map((set) => ({
            type: set.type,
            time: Number(set.time),
            wait: Number(set.wait),
          })),
        })),
      }

      const isEdit = Boolean(editingSessionId)
      const response = await fetch(
        isEdit ? `${API_URL}/sessions/${editingSessionId}` : `${API_URL}/sessions`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        },
      )

      const responsePayload = await safeJson(response)
      if (!response.ok) {
        throw new Error(
          responsePayload.message ||
            (isEdit
              ? 'Impossible de modifier la seance'
              : 'Impossible de creer la seance'),
        )
      }

      await refreshSessions(authToken)
      closeCreateMode()
      resetDraft()
      showToast('success', editingSessionId ? 'Seance mise a jour.' : 'Seance creee.')
    } catch (error) {
      setDraftError(
        error.message ||
          (editingSessionId
            ? 'Erreur lors de la modification de la seance'
            : 'Erreur lors de la creation de la seance'),
      )
    } finally {
      setIsSavingDraft(false)
    }
  }

  const deleteSession = async () => {
    if (!sessionPendingDelete || !authToken) {
      closeConfirmModal()
      return
    }

    try {
      const response = await fetch(`${API_URL}/sessions/${sessionPendingDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.status === 401) {
        throw new Error('401')
      }

      if (!response.ok) {
        const payload = await safeJson(response)
        throw new Error(payload.message || 'Impossible de supprimer la seance')
      }

      await refreshSessions(authToken)
      showToast('success', `Seance ${sessionPendingDelete.name} supprimee.`)
    } catch (error) {
      if (error?.message?.includes('401')) {
        localStorage.removeItem('auth_token')
        setAuthToken('')
        setSessions({})
        setSessionItems([])
        setSessionsError('Session expiree, reconnecte-toi.')
      } else {
        setSessionsError(error.message || 'Erreur lors de la suppression')
      }
    }

    setSessionPendingDelete(null)
    closeConfirmModal()
  }

  const selectedSession = selectedSessionName ? sessions[selectedSessionName] : null
  const exerciseNames = useMemo(
    () => (selectedSession ? Object.keys(selectedSession) : []),
    [selectedSession],
  )
  const timeline = useMemo(
    () => (selectedSession ? createTimeline(selectedSession) : []),
    [selectedSession],
  )
  const currentPhase = timeline[currentIndex]
  const nextPhase = timeline[currentIndex + 1]

  const totalRemaining = useMemo(() => {
    if (!timeline.length || isFinished) {
      return 0
    }

    const afterCurrent = timeline
      .slice(currentIndex + 1)
      .reduce((sum, step) => sum + step.duration, 0)

    return Math.max(0, remaining) + afterCurrent
  }, [timeline, isFinished, currentIndex, remaining])

  const progressPct = useMemo(() => {
    if (!timeline.length) {
      return 0
    }

    if (isFinished) {
      return 100
    }

    if (!hasStarted) {
      return 0
    }

    return ((currentIndex + 1) / timeline.length) * 100
  }, [timeline, isFinished, hasStarted, currentIndex])

  const completedExercisesCount = useMemo(() => {
    if (!exerciseNames.length) {
      return 0
    }

    if (isFinished) {
      return exerciseNames.length
    }

    const lastWorkIndexByExercise = timeline.reduce((acc, step, index) => {
      if (step.kind === 'work') {
        acc[step.exerciseName] = index
      }
      return acc
    }, {})

    const effectiveProgressIndex = currentIndex + (remaining <= 0 ? 1 : 0)

    return exerciseNames.filter(
      (exerciseName) =>
        Number.isInteger(lastWorkIndexByExercise[exerciseName]) &&
        lastWorkIndexByExercise[exerciseName] < effectiveProgressIndex,
    ).length
  }, [exerciseNames, timeline, isFinished, currentIndex, remaining])

  const elapsedSinceStart = useMemo(() => {
    if (!startedAt) {
      return 0
    }

    return Math.floor((nowTimestamp - startedAt) / 1000)
  }, [startedAt, nowTimestamp])

  const displayedExercise = useMemo(() => {
    if (!currentPhase || isFinished) {
      return 'Seance terminee'
    }

    if (currentPhase.kind === 'rest') {
      if (!nextPhase) {
        return 'A venir : fin de seance'
      }

      return `A venir : ${nextPhase.exerciseName} - ${nextPhase.setNumber}/${nextPhase.setTotal}`
    }

    return `${currentPhase.exerciseName} - ${currentPhase.setNumber}/${currentPhase.setTotal}`
  }, [currentPhase, nextPhase, isFinished])

  const displayedPhase = useMemo(() => {
    if (isFinished) {
      return null
    }

    if (currentPhase?.kind === 'rest') {
      return nextPhase ?? null
    }

    return currentPhase ?? null
  }, [currentPhase, nextPhase, isFinished])

  const isGuardActive = Boolean(selectedSessionName && hasStarted && !isFinished)
  const shouldConfirmDestructive = hasStarted && !isFinished

  const modalContent = useMemo(() => {
    if (pendingAction === 'delete-session') {
      return {
        title: 'Supprimer la seance ? ',
        message: `Cette action supprimera ${sessionPendingDelete?.name ?? 'la seance'} definitivement.`,
        confirmLabel: 'Supprimer',
      }
    }

    if (pendingAction === 'leave-session') {
      return {
        title: 'Quitter la seance ?',
        message: 'Ta progression en cours sera perdue.',
        confirmLabel: 'Quitter',
      }
    }

    if (pendingAction === 'reset-session') {
      return {
        title: 'Reinitialiser la seance ?',
        message: 'Le chrono va repartir de zero.',
        confirmLabel: 'Reinitialiser',
      }
    }

    return {
      title: '',
      message: '',
      confirmLabel: 'Confirmer',
    }
  }, [pendingAction, sessionPendingDelete])

  const closeConfirmModal = () => {
    setIsConfirmOpen(false)
    setPendingAction(null)
    setSessionPendingDelete(null)
  }

  const resetAllState = () => {
    setSelectedSessionName(null)
    setCurrentIndex(0)
    setRemaining(0)
    setIsRunning(false)
    setIsFinished(false)
    setHasStarted(false)
    setStartedAt(null)
    setNowTimestamp(Date.now())
    closeConfirmModal()
  }

  const resetCurrentSessionState = () => {
    if (!timeline.length) {
      return
    }

    setCurrentIndex(0)
    setRemaining(timeline[0].duration)
    setIsRunning(false)
    setIsFinished(false)
    setHasStarted(false)
    setStartedAt(null)
    setNowTimestamp(Date.now())
    closeConfirmModal()
  }

  const executePendingAction = async () => {
    if (pendingAction === 'delete-session') {
      await deleteSession()
      return
    }

    if (pendingAction === 'leave-session') {
      resetAllState()
      return
    }

    if (pendingAction === 'reset-session') {
      resetCurrentSessionState()
      return
    }

    closeConfirmModal()
  }

  const requestAction = (actionName) => {
    if (!shouldConfirmDestructive) {
      if (actionName === 'leave-session') {
        resetAllState()
      }

      if (actionName === 'reset-session') {
        resetCurrentSessionState()
      }

      return
    }

    setIsRunning(false)
    setPendingAction(actionName)
    setIsConfirmOpen(true)
  }

  const playDing = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) {
        return
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const ctx = audioContextRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(1020, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.18)

      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)

      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.24)
    } catch {
      // no-op
    }
  }

  const markStartedNow = () => {
    if (hasStarted) {
      return
    }

    const start = Date.now()
    setHasStarted(true)
    setStartedAt(start)
    setNowTimestamp(start)
  }

  const advancePhase = () => {
    if (!timeline.length || isFinished) {
      return
    }

    const nextIndex = currentIndex + 1
    const phaseToPlay = timeline[currentIndex]
    const targetNext = timeline[nextIndex]

    if (!targetNext) {
      setIsRunning(false)
      setIsFinished(true)
      setRemaining(0)
      return
    }

    if (phaseToPlay?.kind === 'rest' && targetNext.kind === 'work') {
      playDing()
    }

    setCurrentIndex(nextIndex)
    setRemaining(targetNext.duration)
  }

  useEffect(() => {
    if (!hasStarted || !startedAt || isFinished) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [hasStarted, startedAt, isFinished])

  useEffect(() => {
    if (!isGuardActive) {
      return undefined
    }

    const beforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const onPopState = () => {
      window.history.pushState({ timerGuard: true }, '', window.location.href)

      if (!shouldConfirmDestructive) {
        return
      }

      setIsRunning(false)
      setPendingAction('leave-session')
      setIsConfirmOpen(true)
    }

    window.history.pushState({ timerGuard: true }, '', window.location.href)
    window.addEventListener('beforeunload', beforeUnload)
    window.addEventListener('popstate', onPopState)

    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      window.removeEventListener('popstate', onPopState)
    }
  }, [isGuardActive, shouldConfirmDestructive])

  useEffect(() => {
    if (!isRunning || isFinished || !timeline.length) {
      return undefined
    }

    if (remaining <= 0) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setRemaining((prev) => prev - 1)
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [isRunning, isFinished, remaining, timeline.length])

  useEffect(() => {
    if (!isRunning || isFinished || remaining > 0 || !timeline.length) {
      return
    }

    advancePhase()
  }, [isRunning, isFinished, remaining, timeline, currentIndex])

  const openSession = (sessionName) => {
    const nextSession = sessions[sessionName]
    const nextTimeline = createTimeline(nextSession)
    setIsCreateMode(false)
    setSelectedSessionName(sessionName)
    setCurrentIndex(0)
    setRemaining(nextTimeline[0]?.duration ?? 0)
    setIsRunning(false)
    setIsFinished(false)
    setHasStarted(false)
    setStartedAt(null)
    setNowTimestamp(Date.now())
    closeConfirmModal()
  }

  const toggleRun = () => {
    if (!timeline.length) {
      return
    }

    if (isFinished) {
      setCurrentIndex(0)
      setRemaining(timeline[0].duration)
      setIsFinished(false)
      markStartedNow()
      setIsRunning(true)
      return
    }

    if (remaining <= 0) {
      setRemaining(timeline[currentIndex].duration)
    }

    if (!isRunning) {
      markStartedNow()
    }

    setIsRunning((prev) => !prev)
  }

  const skipCurrentPhase = () => {
    if (!timeline.length || isFinished) {
      return
    }

    markStartedNow()
    advancePhase()
  }

  if (!authToken) {
    return (
      <>
        <main className="mx-auto flex min-h-svh w-full max-w-md items-center px-4 py-10">
          <Card className="w-full border-white/10 bg-black/70 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur">
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit border-white/20 bg-white/5 uppercase tracking-[0.18em]">
                Minuteur Sport
              </Badge>
              <CardTitle className="text-2xl text-white">
                {authMode === 'login' ? 'Connexion' : 'Inscription'}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Connecte-toi pour retrouver tes seances.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleAuthSubmit}>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-300" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={authEmail}
                    onChange={(event) => setAuthEmail(event.target.value)}
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
                    onChange={(event) => setAuthPassword(event.target.value)}
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
                onClick={() => {
                  setAuthError('')
                  setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))
                }}
              >
                {authMode === 'login'
                  ? "Pas de compte ? Creer un compte"
                  : 'Deja un compte ? Se connecter'}
              </Button>
            </CardContent>
          </Card>
        </main>
        <ToastBanner toast={toast} />
      </>
    )
  }

  if (isCreateMode) {
    return (
      <>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="outline"
              className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
              onClick={closeCreateMode}
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
            <Button
              className="bg-white text-black hover:bg-zinc-100"
              onClick={saveDraftSession}
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
                onChange={(event) => setDraftSessionName(event.target.value)}
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
                      onClick={() => removeExercise(exerciseIndex)}
                    >
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </Button>
                  </div>
                  <input
                    value={exercise.name}
                    onChange={(event) => updateExerciseName(exerciseIndex, event.target.value)}
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
                              onClick={() => updateSetField(exerciseIndex, setIndex, 'type', 'entrainement')}
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
                              onClick={() => updateSetField(exerciseIndex, setIndex, 'type', 'echauffement')}
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
                              updateSetField(exerciseIndex, setIndex, 'time', event.target.value)
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
                              updateSetField(exerciseIndex, setIndex, 'wait', event.target.value)
                            }
                            className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                          />
                        </label>

                        <div className="flex justify-end md:block">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:bg-zinc-900 hover:text-white"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
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
                      onClick={() => addSet(exerciseIndex)}
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
              onClick={addExercise}
            >
              <Plus className="h-4 w-4" /> Ajouter un exercice
            </Button>
          </div>

          {draftError ? <p className="mt-4 text-sm text-red-400">{draftError}</p> : null}
        </main>
        <ToastBanner toast={toast} />
      </>
    )
  }

  if (!selectedSessionName) {
    return (
      <>
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="mb-10 space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                onClick={openCreateMode}
              >
                <Plus className="h-4 w-4" /> Nouvelle seance
              </Button>
              <Button
                variant="outline"
                className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                onClick={logout}
              >
                Deconnexion
              </Button>
            </div>
            <Badge variant="outline" className="w-fit border-white/20 bg-white/5 uppercase tracking-[0.18em]">
              Minuteur Sport
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Choisis ta seance
            </h1>
            {sessionsError ? (
              <p className="text-sm text-red-400">
                {sessionsError}.
              </p>
            ) : null}
          </div>

          {isLoadingSessions ? (
            <div className="rounded-xl border border-white/10 bg-black/50 p-6 text-zinc-300">
              Chargement des seances...
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.keys(sessions).map((sessionName) => {
              const exercisesCount = Object.keys(sessions[sessionName]).length
              const sessionDuration = createTimeline(sessions[sessionName]).reduce(
                (sum, step) => sum + step.duration,
                0,
              )

              return (
                <Card
                  key={sessionName}
                  className="group border-white/10 bg-black/60 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between text-white capitalize">
                      <span>{sessionName}</span>
                      <Dumbbell className="h-4 w-4 text-zinc-300" />
                    </CardTitle>
                    <CardDescription className="text-zinc-500">
                      {exercisesCount} exercices - {formatTimerValue(sessionDuration)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button className="w-full bg-white text-black hover:bg-zinc-100" onClick={() => openSession(sessionName)}>
                      Lancer la seance
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                        onClick={() => openEditMode(sessionName)}
                      >
                        <Pencil className="h-4 w-4" /> Modifier
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-800/80 bg-black text-red-300 hover:bg-red-950/30 hover:text-red-800"
                        onClick={() => askDeleteSession(sessionName)}
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {!isLoadingSessions && !Object.keys(sessions).length ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-6 text-zinc-300">
              Aucune seance en base pour cet utilisateur.
            </div>
          ) : null}
        </main>

        <Dialog open={isConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-white">{modalContent.title}</DialogTitle>
              <DialogDescription className="text-zinc-400">{modalContent.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                onClick={closeConfirmModal}
              >
                Annuler
              </Button>
              <Button
                className="bg-white text-black hover:bg-zinc-100"
                onClick={executePendingAction}
              >
                {modalContent.confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ToastBanner toast={toast} />
      </>
    )
  }

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 lg:py-10">
        <Button
          variant="outline"
          className="w-fit border-white/15 bg-black/40 text-zinc-200 hover:bg-white/10 hover:text-white"
          onClick={() => requestAction('leave-session')}
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
                {isFinished ? 'Seance terminee' : formatMinutesSeconds(remaining)}
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
                <Button onClick={toggleRun} className="min-w-28 bg-white text-black hover:bg-zinc-100">
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
                  onClick={skipCurrentPhase}
                >
                  <SkipForward className="h-4 w-4" /> Skip
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
                  onClick={() => requestAction('reset-session')}
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
                <p className="text-2xl font-semibold text-white">
                  {formatTimerValue(totalRemaining)}
                </p>
              </div>
              <Separator className="bg-zinc-800" />
              <div>
                <p className="text-zinc-500">Depuis le debut</p>
                <p className="text-2xl font-semibold text-white">
                  {formatElapsed(elapsedSinceStart)}
                </p>
              </div>
              <Separator className="bg-zinc-800" />
              <div>
                <p className="text-zinc-500">Exercices</p>
                <p className="text-2xl font-semibold text-white">
                  {completedExercisesCount}/{exerciseNames.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">{modalContent.title}</DialogTitle>
            <DialogDescription className="text-zinc-400">{modalContent.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-zinc-700 bg-black text-zinc-200 hover:bg-zinc-900"
              onClick={closeConfirmModal}
            >
              Annuler
            </Button>
            <Button className="bg-white text-black hover:bg-zinc-100" onClick={executePendingAction}>
              {modalContent.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ToastBanner toast={toast} />
    </>
  )
}

export default App
