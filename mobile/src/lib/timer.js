export function createTimeline(session) {
  const entries = Object.entries(session)

  return entries.flatMap(([exerciseName, sets], exerciseIndex) => {
    const isLastExercise = exerciseIndex === entries.length - 1

    return sets.flatMap((set, setIndex) => {
      const isLastSet = setIndex === sets.length - 1
      const isLastBlock = isLastExercise && isLastSet
      const setType = set.type === 'echauffement' ? 'echauffement' : 'entrainement'

      const work = {
        kind: 'work',
        label: 'Travail',
        duration: Number(set.time) || 0,
        weight: Number(set.weight) || 0,
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
          weight: Number(set.weight) || 0,
          exerciseName,
          setNumber: setIndex + 1,
          setTotal: sets.length,
          setType,
        },
      ]
    })
  })
}

export function resolveTimerPosition(timeline, currentIndex, phaseEndAt, now = Date.now()) {
  if (!timeline.length) {
    return {
      currentIndex: 0,
      remaining: 0,
      phaseEndAt: null,
      finished: true,
      crossedRestToWork: false,
    }
  }

  const safeIndex = Math.min(Math.max(0, currentIndex), timeline.length - 1)
  const safeEndAt = Number(phaseEndAt)

  if (phaseEndAt == null || !Number.isFinite(safeEndAt)) {
    return {
      currentIndex: safeIndex,
      remaining: timeline[safeIndex]?.duration ?? 0,
      phaseEndAt: null,
      finished: false,
      crossedRestToWork: false,
    }
  }

  if (now < safeEndAt) {
    return {
      currentIndex: safeIndex,
      remaining: Math.max(0, Math.ceil((safeEndAt - now) / 1000)),
      phaseEndAt: safeEndAt,
      finished: false,
      crossedRestToWork: false,
    }
  }

  let index = safeIndex
  let endAt = safeEndAt
  let crossedRestToWork = false

  while (index < timeline.length - 1) {
    const fromStep = timeline[index]
    const nextIndex = index + 1
    const nextStep = timeline[nextIndex]

    if (fromStep?.kind === 'rest' && nextStep?.kind === 'work') {
      crossedRestToWork = true
    }

    index = nextIndex
    endAt += Math.max(0, Number(nextStep?.duration) || 0) * 1000

    if (now < endAt) {
      return {
        currentIndex: index,
        remaining: Math.max(0, Math.ceil((endAt - now) / 1000)),
        phaseEndAt: endAt,
        finished: false,
        crossedRestToWork,
      }
    }
  }

  return {
    currentIndex: timeline.length - 1,
    remaining: 0,
    phaseEndAt: null,
    finished: true,
    crossedRestToWork,
  }
}

export function formatHoursMinutesSeconds(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const hours = Math.floor(safeSeconds / 3600)
  const mins = Math.floor((safeSeconds % 3600) / 60)
  const secs = safeSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function formatEndTime(seconds, now = new Date()) {
  const safeSeconds = Math.max(0, seconds)
  const endTime = new Date(now.getTime() + safeSeconds * 1000)
  return `${String(endTime.getHours()).padStart(2, '0')}h${String(endTime.getMinutes()).padStart(2, '0')}`
}

export function formatMinutesSeconds(seconds) {
  const safeSeconds = Math.max(0, seconds)
  const mins = Math.floor(safeSeconds / 60)
  const secs = safeSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
