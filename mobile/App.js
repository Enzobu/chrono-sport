import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import { StatusBar as ExpoStatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, AppState, NativeModules, PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Vibration } from 'react-native'
import { authRequest } from './src/api/auth'
import { createHistoryEntry, fetchHistory } from './src/api/history'
import {
  createSession,
  deleteSession,
  fetchSessions,
  updateSession,
  setSessionFavorite,
} from './src/api/sessions'
import { ConfirmModal } from './src/components/ConfirmModal'
import { BottomNav } from './src/components/BottomNav'
import { ToastBanner } from './src/components/ToastBanner'
import { createDefaultExercise, createDefaultSet, mapApiSessionsToClient } from './src/lib/sessions'
import { formatWeight } from './src/lib/weight'
import {
  createTimeline,
  formatEndTime,
  formatHoursMinutesSeconds,
  formatMinutesSeconds,
  resolveTimerPosition,
} from './src/lib/timer'
import { AuthScreen } from './src/screens/AuthScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { HomeScreen } from './src/screens/HomeScreen'
import { SessionFormScreen } from './src/screens/SessionFormScreen'
import { TimerScreen } from './src/screens/TimerScreen'
import { WorkoutSummaryScreen } from './src/screens/WorkoutSummaryScreen'
import { SettingsScreen } from './src/screens/SettingsScreen'
import { ThemeProvider, useTheme } from './src/theme/ThemeContext'

const { TimerNotification, ScreenAwake } = NativeModules

function AppContent() {
  const { colors, resolvedScheme } = useTheme()
  const [authToken, setAuthToken] = useState('')
  const [weightUnit, setWeightUnit] = useState('kg')
  const [countdownVibrationEnabled, setCountdownVibrationEnabled] = useState(true)
  const [workoutSoundEnabled, setWorkoutSoundEnabled] = useState(true)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [sessionItems, setSessionItems] = useState([])
  const [sessions, setSessions] = useState({})
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState('')
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const [screen, setScreen] = useState('auth')
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [draftSessionName, setDraftSessionName] = useState('')
  const [draftExercises, setDraftExercises] = useState([createDefaultExercise()])
  const [draftError, setDraftError] = useState('')
  const [draftSaving, setDraftSaving] = useState(false)
  const [draftInitialSnapshot, setDraftInitialSnapshot] = useState('')

  const [selectedSessionName, setSelectedSessionName] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [startedAt, setStartedAt] = useState(null)
  const [phaseEndAt, setPhaseEndAt] = useState(null)
  const [nowTimestamp, setNowTimestamp] = useState(Date.now())
  const [finishedAt, setFinishedAt] = useState(null)

  const [confirmVisible, setConfirmVisible] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [sessionPendingDelete, setSessionPendingDelete] = useState(null)
  const [nameConflictOpen, setNameConflictOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [showWeightOverlay, setShowWeightOverlay] = useState(false)

  const soundRef = useRef(null)
  const timerClockRef = useRef({ currentIndex: 0, phaseEndAt: null })
  const weightOverlayTimeoutRef = useRef(null)
  const appStateRef = useRef(AppState.currentState)
  const historyRecordedRef = useRef(false)

  const ensureNotificationPermission = async () => {
    if (Platform.OS !== 'android' || Platform.Version < 33) {
      return true
    }

    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    )

    if (alreadyGranted) {
      return true
    }

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
    return result === PermissionsAndroid.RESULTS.GRANTED
  }

  const showToast = (type, message) => setToast({ type, message, id: Date.now() })

  const setIdleAudioMode = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.InterruptionModeIOS.MixWithOthers,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
      interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
    })
  }

  const setCueAudioMode = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: Audio.InterruptionModeIOS.MixWithOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeAndroid: Audio.InterruptionModeAndroid.DuckOthers,
    })
  }

  const loadDingSound = async () => {
    if (soundRef.current) {
      return soundRef.current
    }

    const { sound } = await Audio.Sound.createAsync(
      require('./assets/sounds/ding.wav'),
      { shouldPlay: false, volume: 1.0 },
    )
    await sound.setVolumeAsync(1)
    soundRef.current = sound
    return sound
  }

  useEffect(() => {
    if (Platform.OS !== 'android' || !ScreenAwake) return undefined
    const shouldKeepAwake = screen === 'timer' && isRunning && !isFinished
    ScreenAwake.setKeepAwake(shouldKeepAwake)
    return () => {
      ScreenAwake.setKeepAwake(false)
    }
  }, [screen, isRunning, isFinished])

  useEffect(() => {
    AsyncStorage.getItem('workout_sound_enabled').then((value) => {
      if (value != null) setWorkoutSoundEnabled(value !== 'false')
    })
  }, [])

  useEffect(() => {
    AsyncStorage.setItem('workout_sound_enabled', String(workoutSoundEnabled)).catch(() => {})
  }, [workoutSoundEnabled])

  useEffect(() => {
    AsyncStorage.getItem('countdown_vibration_enabled').then((value) => {
      if (value != null) setCountdownVibrationEnabled(value !== 'false')
    })
  }, [])

  useEffect(() => {
    AsyncStorage.setItem('countdown_vibration_enabled', String(countdownVibrationEnabled)).catch(() => {})
  }, [countdownVibrationEnabled])

  useEffect(() => {
    AsyncStorage.getItem('weight_unit').then((unit) => {
      if (unit === 'kg' || unit === 'lb') setWeightUnit(unit)
    })
  }, [])

  useEffect(() => {
    AsyncStorage.setItem('weight_unit', weightUnit).catch(() => {})
  }, [weightUnit])

  useEffect(() => {
    AsyncStorage.getItem('auth_token').then((token) => {
      if (token) {
        setAuthToken(token)
        setScreen('dashboard')
      }
    })
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'android' || Platform.Version < 33) {
      return
    }

    ensureNotificationPermission().catch(() => {
      console.error('Notification permission request failed')
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const prepareDing = async () => {
      try {
        await setIdleAudioMode()

        if (cancelled) {
          return
        }
      } catch (error) {
        console.error('Ding audio init failed', error)
      }
    }

    prepareDing()

    return () => {
      cancelled = true
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {
          // no-op
        })
        soundRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!toast) {
      return undefined
    }
    const timeoutId = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timeoutId)
  }, [toast])

  const refreshHistory = async (token) => {
    if (!token) { setHistory([]); return }
    setHistoryLoading(true)
    try { setHistory(await fetchHistory(token)) } finally { setHistoryLoading(false) }
  }

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
        await Promise.all([refreshSessions(authToken), refreshHistory(authToken)])
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

    return completedDuration + Math.max(0, currentPhase.duration - remaining)
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

  const nextSetPreview = useMemo(() => {
    if (currentPhase?.kind !== 'rest' || nextPhase?.kind !== 'work' || !selectedSessionName) return null
    const sourceSession = sessionItems.find((session) => session.name === selectedSessionName)
    const sourceExercise = sourceSession?.exercises?.find((exercise) => exercise.name === nextPhase.exerciseName)
    return {
      exerciseName: nextPhase.exerciseName,
      setNumber: nextPhase.setNumber,
      setTotal: nextPhase.setTotal,
      setType: nextPhase.setType,
      weight: nextPhase.weight,
      trackWeight: sourceExercise?.trackWeight !== false,
    }
  }, [currentPhase, nextPhase, selectedSessionName, sessionItems])

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
    if (!displayedTracksWeight) return null
    const weight = Number(displayedPhase?.weight)
    if (!Number.isFinite(weight)) {
      return null
    }
    return formatWeight(weight, weightUnit)
  }, [displayedPhase, displayedTracksWeight, weightUnit])

  const showCurrentOrNextWeight = () => {
    if (isFinished || !displayedWeightLabel || !displayedPhase?.kind) {
      return
    }

    if (showWeightOverlay) {
      setShowWeightOverlay(false)
      if (weightOverlayTimeoutRef.current) {
        clearTimeout(weightOverlayTimeoutRef.current)
        weightOverlayTimeoutRef.current = null
      }
      return
    }

    setShowWeightOverlay(true)
    if (weightOverlayTimeoutRef.current) {
      clearTimeout(weightOverlayTimeoutRef.current)
    }

    weightOverlayTimeoutRef.current = setTimeout(() => {
      setShowWeightOverlay(false)
      weightOverlayTimeoutRef.current = null
    }, 5000)
  }

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

  useEffect(() => {
    if (isFinished || !displayedWeightLabel) {
      setShowWeightOverlay(false)
    }
  }, [isFinished, displayedWeightLabel])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      appStateRef.current = nextState

      if (nextState === 'active' && Platform.OS === 'android' && TimerNotification) {
        TimerNotification.dismissRestFinishedNotification()
      }
    })

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    const syncNativeTimer = async () => {
      if (Platform.OS !== 'android' || !TimerNotification) {
        return
      }

      if (
        !isRunning ||
        isFinished ||
        !timeline.length ||
        phaseEndAt == null ||
        !Number.isFinite(Number(phaseEndAt))
      ) {
        TimerNotification.stop()
        return
      }

      const permissionGranted = await ensureNotificationPermission()
      if (!permissionGranted) {
        TimerNotification.stop()
        return
      }

      const restEndTimestamps = []
      const now = Date.now()
      let boundaryAt = Number(phaseEndAt)

      for (let index = currentIndex; index < timeline.length - 1; index += 1) {
        const phase = timeline[index]
        const next = timeline[index + 1]

        if (phase.kind === 'rest' && next.kind === 'work' && boundaryAt > now) {
          restEndTimestamps.push(boundaryAt)
        }

        boundaryAt += Math.max(0, Number(next.duration) || 0) * 1000
      }

      const activePhase = timeline[currentIndex]
      const nextWorkPhase =
        activePhase?.kind === 'rest'
          ? timeline.slice(currentIndex + 1).find((phase) => phase.kind === 'work')
          : activePhase
      const phaseLabel = activePhase?.kind === 'rest' ? 'Repos' : 'Série'
      const seriesLabel =
        nextWorkPhase?.setNumber && nextWorkPhase?.setTotal
          ? `${nextWorkPhase.setNumber}/${nextWorkPhase.setTotal}`
          : ''

      TimerNotification.sync(
        restEndTimestamps,
        Number(phaseEndAt),
        phaseLabel,
        seriesLabel,
        workoutSoundEnabled,
      )
    }

    syncNativeTimer().catch((error) => {
      console.error('Native timer notification sync failed', error)
    })
  }, [isRunning, isFinished, currentIndex, phaseEndAt, timeline, workoutSoundEnabled])

  useEffect(() => {
    return () => {
      if (weightOverlayTimeoutRef.current) {
        clearTimeout(weightOverlayTimeoutRef.current)
      }
    }
  }, [])

  const draftSnapshot = useMemo(
    () => JSON.stringify({ name: draftSessionName, exercises: draftExercises }),
    [draftSessionName, draftExercises],
  )
  const hasUnsavedDraftChanges =
    screen === 'create' && Boolean(draftInitialSnapshot) && draftSnapshot !== draftInitialSnapshot

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
    if (
      !isRunning ||
      isFinished ||
      !timeline.length ||
      phaseEndAt == null ||
      !Number.isFinite(Number(phaseEndAt))
    ) {
      return undefined
    }

    timerClockRef.current = {
      currentIndex,
      phaseEndAt,
    }

    const tick = () => {
      const clock = timerClockRef.current
      const phaseBeforeTick = timeline[clock.currentIndex]
      const resolved = resolveTimerPosition(
        timeline,
        clock.currentIndex,
        clock.phaseEndAt,
        Date.now(),
      )

      timerClockRef.current = {
        currentIndex: resolved.currentIndex,
        phaseEndAt: resolved.phaseEndAt,
      }

      setRemaining((previousRemaining) => {
        if (
          phaseBeforeTick?.kind === 'rest' &&
          resolved.currentIndex === clock.currentIndex
        ) {
          if (countdownVibrationEnabled) {
            ;[3, 2, 1].forEach((marker) => {
              if (previousRemaining > marker && resolved.remaining <= marker) {
                Vibration.vibrate(500)
              }
            })
          }
        }

        return resolved.remaining
      })

      if (resolved.crossedRestToWork && appStateRef.current === 'active') {
        playDing().catch((error) => {
          console.error('Foreground rest-to-work cue failed', error)
        })
      }

      if (resolved.finished) {
        timerClockRef.current = { currentIndex: resolved.currentIndex, phaseEndAt: null }
        setIsRunning(false)
        setIsFinished(true)
        setRemaining(0)
        setPhaseEndAt(null)
        return
      }

      if (resolved.currentIndex !== clock.currentIndex) {
        setCurrentIndex(resolved.currentIndex)
      }

      if (resolved.phaseEndAt !== clock.phaseEndAt) {
        setPhaseEndAt(resolved.phaseEndAt)
      }
    }

    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [isRunning, isFinished, timeline, countdownVibrationEnabled])

  const playDing = async () => {
    if (!workoutSoundEnabled) return
    let sound = null

    try {
      await setCueAudioMode()
      sound = await loadDingSound()
      await sound.setPositionAsync(0)
      await sound.playAsync()
    } catch (error) {
      console.error('Ding playback failed', error)
    } finally {
      setTimeout(() => {
        setIdleAudioMode().catch(() => {
          // no-op
        })
      }, 350)

      if (!sound) {
        return
      }

      setTimeout(() => {
        sound
          .unloadAsync()
          .catch(() => {
            // no-op
          })
          .finally(() => {
            if (soundRef.current === sound) {
              soundRef.current = null
            }
          })
      }, 900)
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
    historyRecordedRef.current = false
    setSelectedSessionName(sessionName)
    timerClockRef.current = { currentIndex: 0, phaseEndAt: null }
    setCurrentIndex(0)
    setRemaining(nextTimeline[0]?.duration ?? 0)
    setPhaseEndAt(null)
    setIsRunning(false)
    setIsFinished(false)
    setHasStarted(false)
    setStartedAt(null)
    setNowTimestamp(Date.now())
    setScreen('timer')
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
    setScreen('dashboard')
    setSelectedSessionName(null)
    setFinishedAt(null)
    timerClockRef.current = { currentIndex: 0, phaseEndAt: null }
  }

  const toggleRun = () => {
    if (!timeline.length) {
      return
    }

    const now = Date.now()

    if (isFinished) {
      const firstDuration = timeline[0]?.duration ?? 0
      const firstPhaseEndAt = now + firstDuration * 1000
      timerClockRef.current = { currentIndex: 0, phaseEndAt: firstPhaseEndAt }
      setCurrentIndex(0)
      setRemaining(firstDuration)
      setPhaseEndAt(firstPhaseEndAt)
      setIsFinished(false)
      setHasStarted(true)
      setStartedAt(now)
      setNowTimestamp(now)
      setIsRunning(true)
      return
    }

    if (isRunning) {
      const clock = timerClockRef.current
      const resolved = resolveTimerPosition(timeline, clock.currentIndex, clock.phaseEndAt, now)

      if (resolved.finished) {
        setIsRunning(false)
        setIsFinished(true)
        setRemaining(0)
        setPhaseEndAt(null)
        return
      }

      timerClockRef.current = { currentIndex: resolved.currentIndex, phaseEndAt: null }
      setCurrentIndex(resolved.currentIndex)
      setRemaining(resolved.remaining)
      setPhaseEndAt(null)
      setIsRunning(false)
      return
    }

    markStarted()
    const nextRemaining = remaining > 0 ? remaining : timeline[currentIndex]?.duration ?? 0
    const nextPhaseEndAt = now + nextRemaining * 1000
    timerClockRef.current = { currentIndex, phaseEndAt: nextPhaseEndAt }
    setRemaining(nextRemaining)
    setPhaseEndAt(nextPhaseEndAt)
    setIsRunning(true)
  }

  const adjustRestTime = (deltaSeconds) => {
    if (currentPhase?.kind !== 'rest' || isFinished) return

    const nextRemaining = Math.max(0, remaining + deltaSeconds)
    if (nextRemaining === 0) {
      skipCurrent()
      return
    }

    setRemaining(nextRemaining)
    if (isRunning) {
      const nextPhaseEndAt = Date.now() + nextRemaining * 1000
      timerClockRef.current = { currentIndex, phaseEndAt: nextPhaseEndAt }
      setPhaseEndAt(nextPhaseEndAt)
    }
  }

  const skipCurrent = () => {
    if (!timeline.length || isFinished) {
      return
    }

    const now = Date.now()
    const clock = timerClockRef.current
    let baseIndex = isRunning ? clock.currentIndex : currentIndex

    if (
      isRunning &&
      clock.phaseEndAt != null &&
      Number.isFinite(Number(clock.phaseEndAt))
    ) {
      const resolved = resolveTimerPosition(
        timeline,
        clock.currentIndex,
        clock.phaseEndAt,
        now,
      )

      if (resolved.finished) {
        timerClockRef.current = { currentIndex: resolved.currentIndex, phaseEndAt: null }
        setIsFinished(true)
        setFinishedAt(Date.now())
        setIsRunning(false)
        setRemaining(0)
        setPhaseEndAt(null)
        return
      }

      baseIndex = resolved.currentIndex
    }

    markStarted()
    const nextIndex = baseIndex + 1
    const nextStep = timeline[nextIndex]

    if (!nextStep) {
      timerClockRef.current = { currentIndex: baseIndex, phaseEndAt: null }
      setIsFinished(true)
      setFinishedAt(Date.now())
      setIsRunning(false)
      setRemaining(0)
      setPhaseEndAt(null)
      return
    }

    const nextPhaseEndAt = isRunning ? now + nextStep.duration * 1000 : null
    timerClockRef.current = { currentIndex: nextIndex, phaseEndAt: nextPhaseEndAt }
    setCurrentIndex(nextIndex)
    setRemaining(nextStep.duration)
    setPhaseEndAt(nextPhaseEndAt)
  }

  const resetTimerSession = () => {
    if (!timeline.length) {
      return
    }
    timerClockRef.current = { currentIndex: 0, phaseEndAt: null }
    setCurrentIndex(0)
    setRemaining(timeline[0].duration)
    setPhaseEndAt(null)
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
        if (set.time < 1 || set.wait < 0 || set.weight < 0) {
          return 'Chaque serie doit avoir une duree >= 1, un repos >= 0 et un poids >= 0.'
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

    const normalizedName = draftSessionName.trim().toLocaleLowerCase('fr')
    const duplicateName = sessionItems.some(
      (session) => session.id !== editingSessionId && session.name.trim().toLocaleLowerCase('fr') === normalizedName,
    )
    if (duplicateName) {
      setNameConflictOpen(true)
      return
    }

    setDraftSaving(true)
    setDraftError('')

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

    try {
      if (editingSessionId) {
        await updateSession(authToken, editingSessionId, payload)
      } else {
        await createSession(authToken, payload)
      }

      await refreshSessions(authToken)
      setScreen('dashboard')
      setEditingSessionId(null)
      setDraftSessionName('')
      setDraftExercises([createDefaultExercise()])
      setDraftInitialSnapshot('')
      showToast('success', editingSessionId ? 'Seance mise a jour.' : 'Seance creee.')
    } catch (error) {
      if (error.message === 'Une séance avec ce nom existe déjà.') setNameConflictOpen(true)
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
      setScreen('dashboard')
      setSelectedSessionName(null)
      timerClockRef.current = { currentIndex: 0, phaseEndAt: null }
      setIsRunning(false)
      setPhaseEndAt(null)
      closeConfirm()
      return
    }

    if (pendingAction === 'leave-editor') {
      setScreen('dashboard')
      setEditingSessionId(null)
      setDraftSessionName('')
      setDraftExercises([createDefaultExercise()])
      setDraftInitialSnapshot('')
      setDraftError('')
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
    const initialExercises = [createDefaultExercise()]
    setEditingSessionId(null)
    setDraftSessionName('')
    setDraftExercises(initialExercises)
    setDraftInitialSnapshot(JSON.stringify({ name: '', exercises: initialExercises }))
    setDraftError('')
    setScreen('create')
  }

  const openEdit = (sessionName) => {
    const target = sessionItems.find((session) => session.name === sessionName)
    if (!target) {
      return
    }

    const initialExercises = target.exercises.map((exercise) => ({
        name: exercise.name,
        note: exercise.note ?? '',
        sets: exercise.sets.map((set) => ({
          type: set.type,
          time: Number(set.time),
          wait: Number(set.wait),
          weight: Number(set.weight) || 0,
        })),
      }))

    setEditingSessionId(target.id)
    setDraftSessionName(target.name)
    setDraftExercises(initialExercises)
    setDraftInitialSnapshot(JSON.stringify({ name: target.name, exercises: initialExercises }))
    setDraftError('')
    setScreen('create')
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

  const submitAuth = async () => {
    setAuthLoading(true)
    setAuthError('')

    try {
      const payload = await authRequest(authMode, authEmail, authPassword)
      await AsyncStorage.setItem('auth_token', payload.token)
      setAuthToken(payload.token)
      setAuthPassword('')
      setScreen('dashboard')
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
    setHistory([])
    setScreen('auth')
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
      <ExpoStatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} translucent={false} />

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

      {screen === 'dashboard' ? (
        <DashboardScreen sessions={sessions} sessionItems={sessionItems} history={history} onOpenSessions={() => setScreen('sessions')} onOpenSession={openSession} />
      ) : null}

      {screen === 'sessions' ? (
        <HomeScreen
          sessions={sessions}
          isLoading={sessionsLoading}
          error={sessionsError}
          onOpenCreate={openCreate}
          onOpenSession={openSession}
          onEditSession={openEdit}
          onDuplicateSession={duplicateSession}
          onDeleteSession={askDelete}
          sessionItems={sessionItems}
          onToggleFavorite={toggleFavorite}
        />
      ) : null}

      {screen === 'account' ? (
        <SettingsScreen
          onLogout={logout}
          weightUnit={weightUnit}
          onWeightUnitChange={setWeightUnit}
          countdownVibrationEnabled={countdownVibrationEnabled}
          onCountdownVibrationChange={setCountdownVibrationEnabled}
          workoutSoundEnabled={workoutSoundEnabled}
          onWorkoutSoundChange={setWorkoutSoundEnabled}
          history={history}
          loadingHistory={historyLoading}
        />
      ) : null}

      {screen === 'create' ? (
        <SessionFormScreen
          editing={Boolean(editingSessionId)}
          sessionName={draftSessionName}
          exercises={draftExercises}
          error={draftError}
          saving={draftSaving}
          onBack={() => {
            if (hasUnsavedDraftChanges) {
              openConfirm('leave-editor')
            } else {
              setScreen('dashboard')
              setDraftInitialSnapshot('')
            }
          }}
          onSave={saveSessionDraft}
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
      ) : null}

      {screen === 'timer' && isFinished && hasStarted ? (
        <WorkoutSummaryScreen
          sessionName={selectedSessionName}
          durationSeconds={elapsedSinceStart}
          exercises={exerciseNames.length}
          sets={completedSetsCount}
          finishedAt={finishSummaryAt}
          onDone={closeWorkoutSummary}
        />
      ) : null}

      {screen === 'timer' && !(isFinished && hasStarted) ? (
        <TimerScreen
          sessionName={selectedSessionName}
          phaseLabel={isFinished ? 'Termine' : currentPhase?.label || 'Seance'}
          chronoLabel={isFinished ? 'Seance terminee' : formatMinutesSeconds(Math.max(0, remaining))}
          weightOverlayLabel={displayedWeightLabel}
          showWeightOverlay={showWeightOverlay && Boolean(displayedWeightLabel) && !isFinished}
          exerciseLabel={displayedExercise}
          exerciseNote={displayedExerciseNote}
          nextSetPreview={nextSetPreview}
          progressPct={progressPct}
          totalRemainingLabel={`${formatHoursMinutesSeconds(totalRemaining)}・${formatEndTime(totalRemaining)}`}
          elapsedLabel={formatHoursMinutesSeconds(elapsedSinceStart)}
          exercisesStat={`${completedExercisesCount}/${exerciseNames.length}`}
          isWarmup={displayedPhase?.setType === 'echauffement'}
          isRunning={isRunning}
          isFinished={isFinished}
          sessionOutline={sessionOutline}
          weightUnit={weightUnit}
          onBack={() => openConfirm('leave-session')}
          onToggleRun={toggleRun}
          onSkip={skipCurrent}
          onAdjustRest={adjustRestTime}
          onReset={() => openConfirm('reset-session')}
          onTimerPress={showCurrentOrNextWeight}
        />
      ) : null}

      {['dashboard', 'sessions', 'account'].includes(screen) ? (
        <BottomNav active={screen} onChange={setScreen} />
      ) : null}

      <ConfirmModal
        visible={nameConflictOpen}
        title="Nom déjà utilisé"
        message="Une séance avec ce nom existe déjà. Modifie le nom pour pouvoir enregistrer."
        confirmLabel="OK"
        hideCancel
        onCancel={() => setNameConflictOpen(false)}
        onConfirm={() => setNameConflictOpen(false)}
      />

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
  },
})

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
