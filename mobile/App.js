import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useRef, useState } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'
import { authRequest } from './src/api/auth'
import {
  createSession,
  deleteSession,
  fetchSessions,
  updateSession,
} from './src/api/sessions'
import { ConfirmModal } from './src/components/ConfirmModal'
import { ToastBanner } from './src/components/ToastBanner'
import { createDefaultExercise, createDefaultSet, mapApiSessionsToClient } from './src/lib/sessions'
import {
  createTimeline,
  formatHoursMinutesSeconds,
  formatMinutesSeconds,
} from './src/lib/timer'
import { AuthScreen } from './src/screens/AuthScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { SessionFormScreen } from './src/screens/SessionFormScreen'
import { TimerScreen } from './src/screens/TimerScreen'
import { colors } from './src/styles/theme'

export default function App() {
  const [authToken, setAuthToken] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [sessionItems, setSessionItems] = useState([])
  const [sessions, setSessions] = useState({})
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState('')

  const [screen, setScreen] = useState('auth')
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [draftSessionName, setDraftSessionName] = useState('')
  const [draftExercises, setDraftExercises] = useState([createDefaultExercise()])
  const [draftError, setDraftError] = useState('')
  const [draftSaving, setDraftSaving] = useState(false)

  const [selectedSessionName, setSelectedSessionName] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [nowTimestamp, setNowTimestamp] = useState(Date.now())

  const [confirmVisible, setConfirmVisible] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [sessionPendingDelete, setSessionPendingDelete] = useState(null)
  const [toast, setToast] = useState(null)

  const soundRef = useRef(null)

  const showToast = (type, message) => setToast({ type, message, id: Date.now() })

  useEffect(() => {
    AsyncStorage.getItem('auth_token').then((token) => {
      if (token) {
        setAuthToken(token)
        setScreen('home')
      }
    })
  }, [])

  useEffect(() => {
    if (!toast) {
      return undefined
    }
    const timeoutId = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timeoutId)
  }, [toast])

  const refreshSessions = async (token) => {
    if (!token) {
      setSessionItems([])
      setSessions({})
      return
    }
    const apiSessions = await fetchSessions(token)
    setSessionItems(apiSessions)
    setSessions(mapApiSessionsToClient(apiSessions))
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!authToken) {
        setSessionsLoading(false)
        return
      }

      setSessionsLoading(true)
      setSessionsError('')
      try {
        await refreshSessions(authToken)
      } catch (error) {
        if (!cancelled) {
          setSessionsError(
            error?.message?.includes('401')
              ? 'Session expiree, reconnecte-toi.'
              : error.message,
          )
          if (error?.message?.includes('401')) {
            await AsyncStorage.removeItem('auth_token')
            setAuthToken('')
            setScreen('auth')
          }
        }
      } finally {
        if (!cancelled) {
          setSessionsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [authToken])

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

  const totalWorkDuration = useMemo(
    () => timeline.reduce((sum, step) => sum + (step.kind === 'work' ? step.duration : 0), 0),
    [timeline],
  )

  const elapsedWorkDuration = useMemo(() => {
    if (!timeline.length || !hasStarted) {
      return 0
    }
    if (isFinished) {
      return totalWorkDuration
    }

    const completedWork = timeline.reduce((sum, step, index) => {
      if (step.kind === 'work' && index < effectiveProgressIndex) {
        return sum + step.duration
      }
      return sum
    }, 0)

    if (currentPhase?.kind !== 'work' || remaining <= 0) {
      return completedWork
    }

    return completedWork + Math.max(0, currentPhase.duration - remaining)
  }, [timeline, hasStarted, isFinished, totalWorkDuration, effectiveProgressIndex, currentPhase, remaining])

  const progressPct = useMemo(() => {
    if (!totalWorkDuration) {
      return 0
    }
    return Math.min(100, (elapsedWorkDuration / totalWorkDuration) * 100)
  }, [elapsedWorkDuration, totalWorkDuration])

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
      (name) =>
        Number.isInteger(lastWorkIndexByExercise[name]) &&
        lastWorkIndexByExercise[name] < effectiveProgressIndex,
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

  const displayedPhase = useMemo(() => {
    if (isFinished) {
      return null
    }
    if (currentPhase?.kind === 'rest') {
      return nextPhase ?? null
    }
    return currentPhase ?? null
  }, [currentPhase, nextPhase, isFinished])

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
          done,
          current,
        }
      })

      return {
        exerciseName,
        sets: mappedSets,
        done: mappedSets.every((set) => set.done),
        hasCurrent: mappedSets.some((set) => set.current),
      }
    })
  }, [selectedSession, completedWorkKeys, currentWorkKey, isFinished])

  const confirmContent = useMemo(() => {
    if (pendingAction === 'delete-session') {
      return {
        title: 'Supprimer la seance ? ',
        message: `Cette action supprimera ${sessionPendingDelete?.name ?? 'la seance'} definitivement.`,
        confirmLabel: 'Supprimer',
      }
    }
    if (pendingAction === 'leave-session') {
      return {
        title: 'Quitter la seance ? ',
        message: 'Ta progression en cours sera perdue.',
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

  const closeConfirm = () => {
    setConfirmVisible(false)
    setPendingAction(null)
    setSessionPendingDelete(null)
  }

  const openConfirm = (action) => {
    setPendingAction(action)
    setConfirmVisible(true)
  }

  useEffect(() => {
    if (!hasStarted || !startedAt || isFinished) {
      return undefined
    }
    const id = setInterval(() => setNowTimestamp(Date.now()), 1000)
    return () => clearInterval(id)
  }, [hasStarted, startedAt, isFinished])

  useEffect(() => {
    if (!isRunning || isFinished || !timeline.length || remaining <= 0) {
      return undefined
    }

    const id = setTimeout(() => setRemaining((prev) => prev - 1), 1000)
    return () => clearTimeout(id)
  }, [isRunning, isFinished, remaining, timeline.length])

  useEffect(() => {
    if (!isRunning || isFinished || remaining > 0 || !timeline.length) {
      return
    }

    const nextIndex = currentIndex + 1
    const fromStep = timeline[currentIndex]
    const toStep = timeline[nextIndex]

    if (!toStep) {
      setIsRunning(false)
      setIsFinished(true)
      setRemaining(0)
      return
    }

    if (fromStep?.kind === 'rest' && toStep.kind === 'work') {
      playDing()
    }

    setCurrentIndex(nextIndex)
    setRemaining(toStep.duration)
  }, [isRunning, isFinished, remaining, timeline, currentIndex])

  const playDing = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync({
        uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg',
      })
      soundRef.current = sound
      await sound.playAsync()
    } catch {
      // no-op
    }
  }

  const markStarted = () => {
    if (hasStarted) {
      return
    }
    const start = Date.now()
    setHasStarted(true)
    setStartedAt(start)
    setNowTimestamp(start)
  }

  const openSession = (sessionName) => {
    const nextSession = sessions[sessionName]
    const nextTimeline = createTimeline(nextSession)
    setSelectedSessionName(sessionName)
    setCurrentIndex(0)
    setRemaining(nextTimeline[0]?.duration ?? 0)
    setIsRunning(false)
    setIsFinished(false)
    setHasStarted(false)
    setStartedAt(null)
    setNowTimestamp(Date.now())
    setScreen('timer')
  }

  const toggleRun = () => {
    if (!timeline.length) {
      return
    }

    if (isFinished) {
      setCurrentIndex(0)
      setRemaining(timeline[0].duration)
      setIsFinished(false)
      markStarted()
      setIsRunning(true)
      return
    }

    if (remaining <= 0) {
      setRemaining(timeline[currentIndex].duration)
    }

    if (!isRunning) {
      markStarted()
    }

    setIsRunning((prev) => !prev)
  }

  const skipCurrent = () => {
    if (!timeline.length || isFinished) {
      return
    }

    markStarted()
    const nextIndex = currentIndex + 1
    const nextStep = timeline[nextIndex]

    if (!nextStep) {
      setIsFinished(true)
      setIsRunning(false)
      setRemaining(0)
      return
    }

    setCurrentIndex(nextIndex)
    setRemaining(nextStep.duration)
  }

  const resetTimerSession = () => {
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
        if (set.time < 1 || set.wait < 0) {
          return 'Chaque serie doit avoir une duree >= 1 et un repos >= 0.'
        }
      }
    }

    return ''
  }

  const saveSessionDraft = async () => {
    const validation = validateDraft()
    if (validation) {
      setDraftError(validation)
      return
    }

    if (!authToken) {
      setDraftError('Tu dois etre connecte.')
      return
    }

    setDraftSaving(true)
    setDraftError('')

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

    try {
      if (editingSessionId) {
        await updateSession(authToken, editingSessionId, payload)
      } else {
        await createSession(authToken, payload)
      }

      await refreshSessions(authToken)
      setScreen('home')
      setEditingSessionId(null)
      setDraftSessionName('')
      setDraftExercises([createDefaultExercise()])
      showToast('success', editingSessionId ? 'Seance mise a jour.' : 'Seance creee.')
    } catch (error) {
      setDraftError(error.message || 'Erreur de sauvegarde')
    } finally {
      setDraftSaving(false)
    }
  }

  const onConfirmAction = async () => {
    if (pendingAction === 'delete-session') {
      try {
        await deleteSession(authToken, sessionPendingDelete.id)
        await refreshSessions(authToken)
        showToast('success', `Seance ${sessionPendingDelete.name} supprimee.`)
      } catch (error) {
        setSessionsError(error.message || 'Erreur de suppression')
      }
      closeConfirm()
      return
    }

    if (pendingAction === 'leave-session') {
      setScreen('home')
      setSelectedSessionName(null)
      setIsRunning(false)
      closeConfirm()
      return
    }

    if (pendingAction === 'reset-session') {
      resetTimerSession()
      closeConfirm()
      return
    }

    closeConfirm()
  }

  const openCreate = () => {
    setEditingSessionId(null)
    setDraftSessionName('')
    setDraftExercises([createDefaultExercise()])
    setDraftError('')
    setScreen('create')
  }

  const openEdit = (sessionName) => {
    const target = sessionItems.find((session) => session.name === sessionName)
    if (!target) {
      return
    }

    setEditingSessionId(target.id)
    setDraftSessionName(target.name)
    setDraftExercises(
      target.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
          type: set.type,
          time: Number(set.time),
          wait: Number(set.wait),
        })),
      })),
    )
    setDraftError('')
    setScreen('create')
  }

  const askDelete = (sessionName) => {
    const target = sessionItems.find((session) => session.name === sessionName)
    if (!target) {
      return
    }

    setSessionPendingDelete({ id: target.id, name: target.name })
    openConfirm('delete-session')
  }

  const updateExerciseName = (exerciseIndex, value) => {
    setDraftExercises((prev) =>
      prev.map((exercise, index) =>
        index === exerciseIndex ? { ...exercise, name: value } : exercise,
      ),
    )
  }

  const addExercise = () => setDraftExercises((prev) => [...prev, createDefaultExercise()])

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

  const submitAuth = async () => {
    setAuthLoading(true)
    setAuthError('')

    try {
      const payload = await authRequest(authMode, authEmail, authPassword)
      await AsyncStorage.setItem('auth_token', payload.token)
      setAuthToken(payload.token)
      setAuthPassword('')
      setScreen('home')
    } catch (error) {
      setAuthError(error.message || 'Erreur de connexion')
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token')
    setAuthToken('')
    setSessionItems([])
    setSessions({})
    setScreen('auth')
  }

  return (
    <SafeAreaView style={styles.root}>
      <ExpoStatusBar style="light" backgroundColor={colors.bg} translucent={false} />

      {screen === 'auth' ? (
        <AuthScreen
          authMode={authMode}
          email={authEmail}
          password={authPassword}
          authError={authError}
          loading={authLoading}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onModeToggle={() => {
            setAuthError('')
            setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))
          }}
          onSubmit={submitAuth}
        />
      ) : null}

      {screen === 'home' ? (
        <HomeScreen
          sessions={sessions}
          isLoading={sessionsLoading}
          error={sessionsError}
          onOpenCreate={openCreate}
          onLogout={logout}
          onOpenSession={openSession}
          onEditSession={openEdit}
          onDeleteSession={askDelete}
        />
      ) : null}

      {screen === 'create' ? (
        <SessionFormScreen
          editing={Boolean(editingSessionId)}
          sessionName={draftSessionName}
          exercises={draftExercises}
          error={draftError}
          saving={draftSaving}
          onBack={() => setScreen('home')}
          onSave={saveSessionDraft}
          onSessionNameChange={setDraftSessionName}
          onExerciseNameChange={updateExerciseName}
          onRemoveExercise={removeExercise}
          onSetFieldChange={updateSetField}
          onRemoveSet={removeSet}
          onAddSet={addSet}
          onAddExercise={addExercise}
        />
      ) : null}

      {screen === 'timer' ? (
        <TimerScreen
          sessionName={selectedSessionName}
          phaseLabel={isFinished ? 'Termine' : currentPhase?.label || 'Seance'}
          timerLabel={isFinished ? 'Seance terminee' : formatMinutesSeconds(remaining)}
          exerciseLabel={displayedExercise}
          progressPct={progressPct}
          totalRemainingLabel={formatHoursMinutesSeconds(totalRemaining)}
          elapsedLabel={formatHoursMinutesSeconds(elapsedSinceStart)}
          exercisesStat={`${completedExercisesCount}/${exerciseNames.length}`}
          isWarmup={displayedPhase?.setType === 'echauffement'}
          isRunning={isRunning}
          isFinished={isFinished}
          sessionOutline={sessionOutline}
          onBack={() => openConfirm('leave-session')}
          onToggleRun={toggleRun}
          onSkip={skipCurrent}
          onReset={() => openConfirm('reset-session')}
        />
      ) : null}

      <ConfirmModal
        visible={confirmVisible}
        title={confirmContent.title}
        message={confirmContent.message}
        confirmLabel={confirmContent.confirmLabel}
        onCancel={closeConfirm}
        onConfirm={onConfirmAction}
      />

      <ToastBanner toast={toast} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
})
