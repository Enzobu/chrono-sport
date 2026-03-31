import { useEffect, useMemo, useState } from 'react'
import sessionsData from './data/sessions.json'
import './App.css'

function formatSeconds(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
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

  const selectedSession = selectedSessionName ? sessions[selectedSessionName] : null
  const timeline = useMemo(
    () => (selectedSession ? createTimeline(selectedSession) : []),
    [selectedSession],
  )
  const currentPhase = timeline[currentIndex]

  const totalDuration = useMemo(
    () => timeline.reduce((sum, step) => sum + step.duration, 0),
    [timeline],
  )

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

    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1

      if (nextIndex >= timeline.length) {
        setIsRunning(false)
        setIsFinished(true)
        return prevIndex
      }

      setRemaining(timeline[nextIndex].duration)
      return nextIndex
    })
  }, [isRunning, isFinished, remaining, timeline])

  const openSession = (sessionName) => {
    const nextSession = sessions[sessionName]
    const nextTimeline = createTimeline(nextSession)
    setSelectedSessionName(sessionName)
    setCurrentIndex(0)
    setRemaining(nextTimeline[0]?.duration ?? 0)
    setIsRunning(false)
    setIsFinished(false)
  }

  const goBack = () => {
    setSelectedSessionName(null)
    setCurrentIndex(0)
    setRemaining(0)
    setIsRunning(false)
    setIsFinished(false)
  }

  const toggleRun = () => {
    if (!timeline.length) {
      return
    }

    if (isFinished) {
      setCurrentIndex(0)
      setRemaining(timeline[0].duration)
      setIsFinished(false)
      setIsRunning(true)
      return
    }

    if (remaining <= 0) {
      setRemaining(timeline[currentIndex].duration)
    }

    setIsRunning((prev) => !prev)
  }

  const resetSession = () => {
    if (!timeline.length) {
      return
    }

    setCurrentIndex(0)
    setRemaining(timeline[0].duration)
    setIsRunning(false)
    setIsFinished(false)
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
            <p className="phase-meta">
              {currentPhase.exerciseName} - serie {currentPhase.setNumber}
            </p>
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
          <button className="btn btn-ghost" onClick={resetSession}>
            Reinitialiser
          </button>
        </div>
      </section>

      <p className="total-time">Duree totale: {formatSeconds(totalDuration)}</p>
    </main>
  )
}

export default App
