import { useEffect, useMemo, useRef, useState } from 'react'
import { authRequest } from './api/auth'
import { createHistoryEntry, fetchHistory } from './api/history'
import {
  createSession as createSessionApi,
  deleteSession as deleteSessionApi,
  fetchSessionsFromApi,
  updateSession as updateSessionApi,
  setSessionFavorite,
} from './api/sessions'
import { ConfirmDialog } from './components/ConfirmDialog'
import { BottomNav } from './components/BottomNav'
import { ToastBanner } from './components/ToastBanner'
import { createDefaultExercise, createDefaultSet, mapApiSessionsToClient } from './lib/sessions'
import { formatWeight } from './lib/weight'
import {
  createTimeline,
  formatEndTime,
  formatHoursMinutes,
  formatHoursMinutesSeconds,
  formatMinutesSeconds,
} from './lib/timer'
import { AuthPage } from './pages/AuthPage'
import { CreateSessionPage } from './pages/CreateSessionPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { TimerPage } from './pages/TimerPage'
import { WorkoutSummaryPage } from './pages/WorkoutSummaryPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('theme_mode') ?? 'system')
  const [accent, setAccent] = useState(() => localStorage.getItem('theme_accent') ?? 'blue')
  const [weightUnit, setWeightUnit] = useState(() => localStorage.getItem('weight_unit') ?? 'kg')
  const [systemTheme, setSystemTheme] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )
  const [mainTab, setMainTab] = useState('home')
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
  const [history, setHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const [isCreateMode, setIsCreateMode] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [draftSessionName, setDraftSessionName] = useState('')
  const [draftExercises, setDraftExercises] = useState([createDefaultExercise()])
  const [draftError, setDraftError] = useState('')
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [draftInitialSnapshot, setDraftInitialSnapshot] = useState('')

  const [selectedSessionName, setSelectedSessionName] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [nowTimestamp, setNowTimestamp] = useState(Date.now())
  const [finishedAt, setFinishedAt] = useState(null)

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [sessionPendingDelete, setSessionPendingDelete] = useState(null)

  const [toast, setToast] = useState(null)
  const [showWeightOverlay, setShowWeightOverlay] = useState(false)
  const audioContextRef = useRef(null)
  const weightOverlayTimeoutRef = useRef(null)
  const historyRecordedRef = useRef(false)

  const showToast = (type, message) => setToast({ type, message, id: Date.now() })
  const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    localStorage.setItem('theme_mode', themeMode)
    localStorage.setItem('theme_accent', accent)
    localStorage.setItem('weight_unit', weightUnit)
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.dataset.accent = accent
  }, [themeMode, accent, resolvedTheme, weightUnit])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null)
    }, 2600)

    return () => window.clearTimeout(timeoutId)
  }, [toast])

  const refreshHistory = async (token) => {
    if (!token) { setHistory([]); return }
    setIsLoadingHistory(true)
    try { setHistory(await fetchHistory(token)) } finally { setIsLoadingHistory(false) }
  }

  const refreshSessions = async (token) => {
    if (!token) {
      setSessionItems([])
      setSessions({})
      return
    }

    const apiSessions = await fetchSessionsFromApi(token)
    setSessionItems(apiSessions)
    setSessions(mapApiSessionsToClient(apiSessions))
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!authToken) {
        setIsLoadingSessions(false)
        setSessionItems([])
        setSessions({})
        setSessionsError('')
        return
      }

      setIsLoadingSessions(true)
      setSessionsError('')

      try {
        await Promise.all([refreshSessions(authToken), refreshHistory(authToken)])
      } catch (error) {
        if (error?.message?.includes('401')) {
          localStorage.removeItem('auth_token')
          if (!cancelled) {
            setAuthToken('')
            setSessionItems([])
            setSessions({})
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

    load()
    return () => {
      cancelled = true
    }
  }, [authToken])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setIsAuthLoading(true)
    setAuthError('')

    try {
      const payload = await authRequest(authMode, authEmail, authPassword)
      localStorage.setItem('auth_token', payload.token)
      setAuthToken(payload.token)
      setAuthPassword('')
    } catch (error) {
      setAuthError(error.message || 'Erreur de connexion')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const resetDraft = () => {
    const initialExercises = [createDefaultExercise()]
    setEditingSessionId(null)
    setDraftSessionName('')
    setDraftExercises(initialExercises)
    setDraftInitialSnapshot(JSON.stringify({ name: '', exercises: initialExercises }))
    setDraftError('')
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setAuthToken('')
    setSessionItems([])
    setSessions({})
    setHistory([])
    setIsCreateMode(false)
    setMainTab('home')
    setEditingSessionId(null)
    setSelectedSessionName(null)
    setSessionsError('')
    setHasStarted(false)
    setIsRunning(false)
  }

  const openCreateMode = () => {
    resetDraft()
    setSelectedSessionName(null)
    setIsCreateMode(true)
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

    const initialExercises = (target.exercises ?? []).map((exercise) => ({
        name: exercise.name,
        sets: (exercise.sets ?? []).map((set) => ({
          type: set.type,
          time: Number(set.time) || 60,
          wait: Number(set.wait) || 0,
          weight: Number(set.weight) || 0,
        })),
      }))

    setEditingSessionId(target.id)
    setDraftSessionName(target.name)
    setDraftExercises(initialExercises)
    setDraftInitialSnapshot(JSON.stringify({ name: target.name, exercises: initialExercises }))
    setDraftError('')
    setSelectedSessionName(null)
    setIsCreateMode(true)
  }

  const toggleFavorite = async (sessionName) => {
    const target = sessionItems.find((session) => session.name === sessionName)
    if (!target || !authToken) return
    try {
      await setSessionFavorite(authToken, target.id, !target.favorite)
      await refreshSessions(authToken)
    } catch (error) {
      showToast('error', error.message || 'Impossible de modifier le favori')
    }
  }

  const duplicateSession = (sessionName) => {
    const target = sessionItems.find((session) => session.name === sessionName)
    if (!target) return
    const exercises = (target.exercises ?? []).map((exercise) => ({
      name: exercise.name,
      note: exercise.note ?? '',
      trackWeight: exercise.trackWeight !== false,
      sets: (exercise.sets ?? []).map((set) => ({
        type: set.type,
        time: Number(set.time) || 60,
        wait: Number(set.wait) || 0,
        weight: Number(set.weight) || 0,
      })),
    }))
    const name = `${target.name} copie`
    setEditingSessionId(null)
    setDraftSessionName(name)
    setDraftExercises(exercises)
    setDraftInitialSnapshot(JSON.stringify({ name: target.name, exercises }))
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

  const updateExerciseNote = (exerciseIndex, value) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, note: value } : exercise,
      ),
    )
  }

  const toggleExerciseWeight = (exerciseIndex) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, trackWeight: exercise.trackWeight === false } : exercise,
      ),
    )
  }

  const addExercise = () => setDraftExercises((prev) => [...prev, createDefaultExercise()])

  const insertExercise = (exerciseIndex) => {
    setDraftExercises((prev) => {
      const next = [...prev]
      next.splice(exerciseIndex, 0, createDefaultExercise())
      return next
    })
  }

  const moveExercise = (exerciseIndex, direction) => {
    setDraftExercises((prev) => {
      const targetIndex = exerciseIndex + direction
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev
      }

      const next = [...prev]
      const [exercise] = next.splice(exerciseIndex, 1)
      next.splice(targetIndex, 0, exercise)
      return next
    })
  }

  const duplicateExercise = (exerciseIndex) => {
    setDraftExercises((prev) => {
      const source = prev[exerciseIndex]
      if (!source) return prev
      const copy = {
        ...source,
        name: source.name ? `${source.name} copie` : '',
        sets: source.sets.map((set) => ({ ...set })),
      }
      const next = [...prev]
      next.splice(exerciseIndex + 1, 0, copy)
      return next
    })
  }

  const removeExercise = (exerciseIndex) => {
    setDraftExercises((prev) => prev.filter((_, index) => index !== exerciseIndex))
  }

  const addSet = (exerciseIndex) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise
        }

        const previousSet = exercise.sets[exercise.sets.length - 1]
        const nextSet = previousSet ? { ...previousSet } : createDefaultSet()

        return { ...exercise, sets: [...exercise.sets, nextSet] }
      }),
    )
  }

  const removeSet = (exerciseIndex, setIndex) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) => {
        if (index !== exerciseIndex) {
          return exercise
        }

        const nextSets = exercise.sets.filter((_, idx) => idx !== setIndex)
        return { ...exercise, sets: nextSets.length ? nextSets : [createDefaultSet()] }
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

            if (field === 'weight') {
              return {
                ...set,
                weight: Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0,
              }
            }

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
      for (const set of exercise.sets) {
        if (set.time < 1 || set.wait < 0 || set.weight < 0) {
          return 'Chaque serie doit avoir une duree >= 1, un repos >= 0 et un poids >= 0.'
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
          note: exercise.note?.trim() ?? '',
          trackWeight: exercise.trackWeight !== false,
          sets: exercise.sets.map((set) => ({
            type: set.type,
            time: Number(set.time),
            wait: Number(set.wait),
            weight: Number(set.weight) || 0,
          })),
        })),
      }

      if (editingSessionId) {
        await updateSessionApi(authToken, editingSessionId, payload)
      } else {
        await createSessionApi(authToken, payload)
      }

      await refreshSessions(authToken)
      closeCreateMode()
      setDraftInitialSnapshot('')
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
      await deleteSessionApi(authToken, sessionPendingDelete.id)
      await refreshSessions(authToken)
      showToast('success', `Seance ${sessionPendingDelete.name} supprimee.`)
    } catch (error) {
      if (error?.message?.includes('401')) {
        localStorage.removeItem('auth_token')
        setAuthToken('')
        setSessionItems([])
        setSessions({})
        setSessionsError('Session expiree, reconnecte-toi.')
      } else {
        setSessionsError(error.message || 'Erreur lors de la suppression')
      }
    }

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

  const effectiveProgressIndex = useMemo(
    () => currentIndex + (remaining <= 0 ? 1 : 0),
    [currentIndex, remaining],
  )

  const totalTimelineDuration = useMemo(
    () => timeline.reduce((sum, step) => sum + step.duration, 0),
    [timeline],
  )

  const elapsedTimelineDuration = useMemo(() => {
    if (!timeline.length || !hasStarted) {
      return 0
    }

    if (isFinished) {
      return totalTimelineDuration
    }

    const completedDuration = timeline.reduce((sum, step, index) => {
      if (index < effectiveProgressIndex) {
        return sum + step.duration
      }
      return sum
    }, 0)

    if (!currentPhase || remaining <= 0) {
      return completedDuration
    }

    const currentPhaseProgress = Math.max(0, currentPhase.duration - remaining)
    return completedDuration + currentPhaseProgress
  }, [
    timeline,
    hasStarted,
    isFinished,
    totalTimelineDuration,
    effectiveProgressIndex,
    currentPhase,
    remaining,
  ])

  const progressPct = useMemo(() => {
    if (!totalTimelineDuration) {
      return 0
    }

    return Math.min(100, (elapsedTimelineDuration / totalTimelineDuration) * 100)
  }, [elapsedTimelineDuration, totalTimelineDuration])

  const completedWorkKeys = useMemo(() => {
    const done = new Set()
    timeline.forEach((step, index) => {
      if (step.kind === 'work' && index < effectiveProgressIndex) {
        done.add(`${step.exerciseName}::${step.setNumber}`)
      }
    })
    return done
  }, [timeline, effectiveProgressIndex])

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

    return exerciseNames.filter(
      (exerciseName) =>
        Number.isInteger(lastWorkIndexByExercise[exerciseName]) &&
        lastWorkIndexByExercise[exerciseName] < effectiveProgressIndex,
    ).length
  }, [exerciseNames, timeline, isFinished, effectiveProgressIndex])

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

  const displayedTracksWeight = useMemo(() => {
    const exerciseName = currentPhase?.kind === 'rest' ? nextPhase?.exerciseName : currentPhase?.exerciseName
    if (!exerciseName || !selectedSessionName) return true
    const sourceSession = sessionItems.find((session) => session.name === selectedSessionName)
    return sourceSession?.exercises?.find((exercise) => exercise.name === exerciseName)?.trackWeight !== false
  }, [currentPhase, nextPhase, selectedSessionName, sessionItems])

  const displayedExerciseNote = useMemo(() => {
    const exerciseName = currentPhase?.kind === 'rest' ? nextPhase?.exerciseName : currentPhase?.exerciseName
    if (!exerciseName || !selectedSessionName) return ''
    const sourceSession = sessionItems.find((session) => session.name === selectedSessionName)
    return sourceSession?.exercises?.find((exercise) => exercise.name === exerciseName)?.note ?? ''
  }, [currentPhase, nextPhase, selectedSessionName, sessionItems])

  const displayedPhase = useMemo(() => {
    if (isFinished) {
      return null
    }
    if (currentPhase?.kind === 'rest') {
      return nextPhase ?? null
    }
    return currentPhase ?? null
  }, [currentPhase, nextPhase, isFinished])

  const displayedWeightLabel = useMemo(() => {
    if (!displayedPhase?.kind || !displayedTracksWeight) {
      return null
    }

    const rawWeight = displayedPhase?.weight
    const weight = Number.isFinite(Number(rawWeight)) ? Number(rawWeight) : 0
    return formatWeight(weight, weightUnit)
  }, [displayedPhase, displayedTracksWeight, weightUnit])

  const handleTimerLabelClick = () => {
    if (isFinished || !displayedPhase?.kind) {
      return
    }

    if (showWeightOverlay) {
      setShowWeightOverlay(false)
      if (weightOverlayTimeoutRef.current) {
        window.clearTimeout(weightOverlayTimeoutRef.current)
        weightOverlayTimeoutRef.current = null
      }
      return
    }

    setShowWeightOverlay(true)
    if (weightOverlayTimeoutRef.current) {
      window.clearTimeout(weightOverlayTimeoutRef.current)
    }
    weightOverlayTimeoutRef.current = window.setTimeout(() => {
      setShowWeightOverlay(false)
      weightOverlayTimeoutRef.current = null
    }, 5000)
  }

  useEffect(() => {
    if (isFinished || !displayedWeightLabel) {
      setShowWeightOverlay(false)
    }
  }, [isFinished, displayedWeightLabel])

  useEffect(() => {
    return () => {
      if (!weightOverlayTimeoutRef.current) {
        return
      }
      window.clearTimeout(weightOverlayTimeoutRef.current)
    }
  }, [])

  const currentWorkKey = useMemo(() => {
    if (!currentPhase || isFinished) {
      return ''
    }
    if (currentPhase.kind === 'work') {
      return `${currentPhase.exerciseName}::${currentPhase.setNumber}`
    }
    if (nextPhase?.kind === 'work') {
      return `${nextPhase.exerciseName}::${nextPhase.setNumber}`
    }
    return ''
  }, [currentPhase, nextPhase, isFinished])

  const sessionOutline = useMemo(() => {
    if (!selectedSession) {
      return []
    }

    return Object.entries(selectedSession).map(([exerciseName, sets]) => {
      const sourceSession = sessionItems.find((session) => session.name === selectedSessionName)
      const sourceExercise = sourceSession?.exercises?.find((exercise) => exercise.name === exerciseName)
      const trackWeight = sourceExercise?.trackWeight !== false
      const mappedSets = sets.map((set, index) => {
        const key = `${exerciseName}::${index + 1}`
        const done = completedWorkKeys.has(key)
        const current = key === currentWorkKey && !done && !isFinished
        return {
          key,
          order: index + 1,
          total: sets.length,
          type: set.type,
          time: set.time,
          wait: set.wait,
          weight: set.weight,
          done,
          current,
        }
      })

      return {
        exerciseName,
        trackWeight,
        sets: mappedSets,
        done: mappedSets.every((set) => set.done),
        hasCurrent: mappedSets.some((set) => set.current),
      }
    })
  }, [selectedSession, selectedSessionName, sessionItems, completedWorkKeys, currentWorkKey, isFinished])

  const isSessionOngoing = hasStarted && !isFinished
  const totalRemainingDurationLabel = isSessionOngoing
    ? formatHoursMinutesSeconds(totalRemaining)
    : formatHoursMinutes(totalRemaining)
  const totalRemainingLabel = `${totalRemainingDurationLabel}・${formatEndTime(totalRemaining)}`
  const elapsedLabel = isSessionOngoing
    ? formatHoursMinutesSeconds(elapsedSinceStart)
    : formatHoursMinutes(elapsedSinceStart)

  const draftSnapshot = useMemo(
    () => JSON.stringify({ name: draftSessionName, exercises: draftExercises }),
    [draftSessionName, draftExercises],
  )
  const hasUnsavedDraftChanges =
    isCreateMode && Boolean(draftInitialSnapshot) && draftSnapshot !== draftInitialSnapshot

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
    if (pendingAction === 'leave-editor') {
      return {
        title: 'Quitter sans enregistrer ?',
        message: 'Tes modifications seront perdues.',
        confirmLabel: 'Quitter',
      }
    }
    if (pendingAction === 'reset-session') {
      return {
        title: 'Reinitialiser la seance ? ',
        message: 'Le chrono va repartir de zero.',
        confirmLabel: 'Reinitialiser',
      }
    }
    return { title: '', message: '', confirmLabel: 'Confirmer' }
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
    setFinishedAt(null)
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
    if (pendingAction === 'leave-editor') {
      setIsCreateMode(false)
      setEditingSessionId(null)
      setDraftInitialSnapshot('')
      setDraftError('')
      closeConfirmModal()
      return
    }
    if (pendingAction === 'reset-session') {
      resetCurrentSessionState()
      return
    }
    closeConfirmModal()
  }

  const requestEditorBack = () => {
    if (hasUnsavedDraftChanges) {
      setPendingAction('leave-editor')
      setIsConfirmOpen(true)
      return
    }
    closeCreateMode()
    setDraftInitialSnapshot('')
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

    const intervalId = window.setInterval(() => setNowTimestamp(Date.now()), 1000)
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
    if (!isRunning || isFinished || !timeline.length || remaining <= 0) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setRemaining((prev) => prev - 1), 1000)
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
    historyRecordedRef.current = false
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

  useEffect(() => {
    if (!isFinished || !hasStarted || !selectedSessionName || historyRecordedRef.current || !authToken) return
    historyRecordedRef.current = true
    const target = sessionItems.find((session) => session.name === selectedSessionName)
    const setsCompleted = timeline.filter((step) => step.kind === 'work').length
    createHistoryEntry(authToken, {
      sessionId: target?.id ?? null,
      sessionName: selectedSessionName,
      durationSeconds: Math.max(0, elapsedSinceStart),
      exercisesCompleted: exerciseNames.length,
      setsCompleted,
    }).then(() => refreshHistory(authToken)).catch(() => { historyRecordedRef.current = false })
  }, [isFinished, hasStarted, selectedSessionName, authToken, elapsedSinceStart, exerciseNames.length, timeline, sessionItems])

  const completedSetsCount = timeline.filter((step) => step.kind === 'work').length
  const finishSummaryAt = finishedAt ?? Date.now()
  const closeWorkoutSummary = () => {
    resetAllState()
    setMainTab('home')
    setFinishedAt(null)
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
        <AuthPage
          authMode={authMode}
          authEmail={authEmail}
          authPassword={authPassword}
          authError={authError}
          sessionsError={sessionsError}
          isAuthLoading={isAuthLoading}
          onSubmit={handleAuthSubmit}
          onAuthModeToggle={() => {
            setAuthError('')
            setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))
          }}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
        />
        <ToastBanner toast={toast} />
      </>
    )
  }

  if (isCreateMode) {
    return (
      <>
        <CreateSessionPage
          editingSessionId={editingSessionId}
          draftSessionName={draftSessionName}
          draftExercises={draftExercises}
          draftError={draftError}
          isSavingDraft={isSavingDraft}
          onBack={requestEditorBack}
          onSave={saveDraftSession}
          onSessionNameChange={setDraftSessionName}
          onExerciseNameChange={updateExerciseName}
          weightUnit={weightUnit}
          onExerciseNoteChange={updateExerciseNote}
          onToggleExerciseWeight={toggleExerciseWeight}
          onRemoveExercise={removeExercise}
          onDuplicateExercise={duplicateExercise}
          onMoveExercise={moveExercise}
          onInsertExercise={insertExercise}
          onSetFieldChange={updateSetField}
          onRemoveSet={removeSet}
          onAddSet={addSet}
          onAddExercise={addExercise}
        />
        <ConfirmDialog
          open={isConfirmOpen}
          title={modalContent.title}
          message={modalContent.message}
          confirmLabel={modalContent.confirmLabel}
          onCancel={closeConfirmModal}
          onConfirm={executePendingAction}
        />
        <ToastBanner toast={toast} />
      </>
    )
  }

  if (!selectedSessionName) {
    return (
      <>
        {mainTab === 'home' ? (
          <DashboardPage sessions={sessions} sessionItems={sessionItems} history={history} onOpenSessions={() => setMainTab('sessions')} onOpenSession={openSession} />
        ) : null}
        {mainTab === 'sessions' ? (
          <HomePage
            sessions={sessions}
            sessionsError={sessionsError}
            isLoadingSessions={isLoadingSessions}
            onOpenCreate={openCreateMode}
            onOpenSession={openSession}
            onEditSession={openEditMode}
            onDuplicateSession={duplicateSession}
            onDeleteSession={askDeleteSession}
            sessionItems={sessionItems}
            onToggleFavorite={toggleFavorite}
          />
        ) : null}
        {mainTab === 'account' ? (
          <SettingsPage
            themeMode={themeMode}
            accent={accent}
            resolvedTheme={resolvedTheme}
            onThemeModeChange={setThemeMode}
            onAccentChange={setAccent}
            onLogout={logout}
            weightUnit={weightUnit}
            onWeightUnitChange={setWeightUnit}
            history={history}
            isLoadingHistory={isLoadingHistory}
          />
        ) : null}
        <BottomNav active={mainTab} onChange={setMainTab} />

        <ConfirmDialog
          open={isConfirmOpen}
          title={modalContent.title}
          message={modalContent.message}
          confirmLabel={modalContent.confirmLabel}
          onCancel={closeConfirmModal}
          onConfirm={executePendingAction}
        />
        <ToastBanner toast={toast} />
      </>
    )
  }

  if (isFinished && hasStarted) {
    return (
      <WorkoutSummaryPage
        sessionName={selectedSessionName}
        durationSeconds={elapsedSinceStart}
        exercises={exerciseNames.length}
        sets={completedSetsCount}
        finishedAt={finishSummaryAt}
        onDone={closeWorkoutSummary}
      />
    )
  }

  return (
    <>
      <TimerPage
        selectedSessionName={selectedSessionName}
        isFinished={isFinished}
        currentPhase={currentPhase}
        remainingLabel={formatMinutesSeconds(remaining)}
        weightOverlayLabel={displayedWeightLabel}
        showWeightOverlay={showWeightOverlay}
        displayedExercise={displayedExercise}
        exerciseNote={displayedExerciseNote}
        displayedPhase={displayedPhase}
        progressPct={progressPct}
        isRunning={isRunning}
        totalRemainingLabel={totalRemainingLabel}
        elapsedLabel={elapsedLabel}
        completedExercisesCount={completedExercisesCount}
        exerciseCount={exerciseNames.length}
        sessionOutline={sessionOutline}
        weightUnit={weightUnit}
        onBack={() => requestAction('leave-session')}
        onToggleRun={toggleRun}
        onSkip={skipCurrentPhase}
        onReset={() => requestAction('reset-session')}
        onTimerClick={handleTimerLabelClick}
      />

      <ConfirmDialog
        open={isConfirmOpen}
        title={modalContent.title}
        message={modalContent.message}
        confirmLabel={modalContent.confirmLabel}
        onCancel={closeConfirmModal}
        onConfirm={executePendingAction}
      />
      <ToastBanner toast={toast} />
    </>
  )
}

export default App
