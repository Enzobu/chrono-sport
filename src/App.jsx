import { useEffect, useMemo, useRef, useState } from 'react'
import sessionsData from './data/sessions.json'
import './App.css'

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function formatTimerValue(seconds) {
  const safeSeconds = Math.max(0, seconds)

  if (safeSeconds >= 3600) {
    const hours = Math.floor(safeSeconds / 3600)
    const mins = Math.floor((safeSeconds % 3600) / 60)
    return `${String(hours).padStart(2, '0')}h${String(mins).padStart(2, '0')}min`
  }

  return formatSeconds(safeSeconds)
}

function formatElapsed(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const mins = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}h${String(mins).padStart(2, '0')}min`
  }

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function createTimeline(session) {
  const exerciseEntries = Object.entries(session)

  return exerciseEntries.flatMap(([exerciseName, sets], exerciseIndex) => {
    const isLastExercise = exerciseIndex === exerciseEntries.length - 1

    return sets.flatMap((set, setIndex) => {
      const isLastSet = setIndex === sets.length - 1
      const isLastBlock = isLastExercise && isLastSet
      const work = {
        kind: 'work',
        label: 'Travail',
        duration: Number(set.time) || 0,
        exerciseName,
        setNumber: setIndex + 1,
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
        },
      ]
    })
  })
}

function App() {
  const sessions = useMemo(() => sessionsData ?? {}, [])
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
  const audioContextRef = useRef(null)

  const selectedSession = selectedSessionName ? sessions[selectedSessionName] : null
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

      return `A venir : ${nextPhase.exerciseName} - serie ${nextPhase.setNumber}`
    }

    return `${currentPhase.exerciseName} - serie ${currentPhase.setNumber}`
  }, [currentPhase, nextPhase, isFinished])

  const isGuardActive = Boolean(selectedSessionName && hasStarted && !isFinished)
  const shouldConfirmDestructive = hasStarted && !isFinished

  const modalContent = useMemo(() => {
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

    return {
      title: '',
      message: '',
      confirmLabel: 'Confirmer',
    }
  }, [pendingAction])

  const closeConfirmModal = () => {
    setIsConfirmOpen(false)
    setPendingAction(null)
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

  const executePendingAction = () => {
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

  const goBack = () => {
    requestAction('leave-session')
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

  const resetSession = () => {
    requestAction('reset-session')
  }

  const skipCurrentPhase = () => {
    if (!timeline.length || isFinished) {
      return
    }

    markStartedNow()
    advancePhase()
  }

  if (!selectedSessionName) {
    return (
      <main className="app page-list">
        <header className="hero">
          <p className="kicker">Minuteur Sport</p>
          <h1>Choisis ta seance</h1>
          <p className="subtitle">Lance tes blocs travail/repos automatiquement.</p>
        </header>

        <section className="session-grid">
          {Object.keys(sessions).map((sessionName) => {
            const exercisesCount = Object.keys(sessions[sessionName]).length
            return (
              <button
                key={sessionName}
                className="session-card"
                onClick={() => openSession(sessionName)}
              >
                <h2>{sessionName}</h2>
                <p>{exercisesCount} exercices</p>
              </button>
            )
          })}
        </section>
      </main>
    )
  }

  return (
    <>
      <main className="app page-timer">
        <button className="back-button" onClick={goBack}>
          Retour aux seances
        </button>

        <section className="timer-panel">
          <p className="kicker">Seance {selectedSessionName}</p>
          <h1>{isFinished ? 'Seance terminee' : formatSeconds(remaining)}</h1>
          {currentPhase && !isFinished ? (
            <>
              <p className="phase-label">{currentPhase.label}</p>
              <p className="phase-meta">Exercice : {displayedExercise}</p>
              <p className="phase-progress">
                Etape {Math.min(currentIndex + 1, timeline.length)} / {timeline.length}
              </p>
            </>
          ) : (
            <p className="phase-label">Bravo, tout est termine.</p>
          )}

          <div className="actions">
            <button className="btn btn-primary" onClick={toggleRun}>
              {isFinished ? 'Relancer' : isRunning ? 'Pause' : 'Lancer'}
            </button>
            <button className="btn btn-skip" onClick={skipCurrentPhase}>
              Skip
            </button>
            <button className="btn btn-ghost" onClick={resetSession}>
              Reinitialiser
            </button>
          </div>
        </section>

        <div className="stats">
          <p className="total-time">
            Temps restant global : {formatTimerValue(totalRemaining)}
          </p>
          <p className="total-time">Depuis le debut : {formatElapsed(elapsedSinceStart)}</p>
        </div>
      </main>

      {isConfirmOpen ? (
        <div className="confirm-overlay" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <h2>{modalContent.title}</h2>
            <p>{modalContent.message}</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={closeConfirmModal}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={executePendingAction}>
                {modalContent.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default App
