export function mapApiSessionsToClient(apiSessions) {
  return (apiSessions ?? []).reduce((acc, session) => {
    const exercises = (session.exercises ?? []).reduce((exerciseAcc, exercise) => {
      const sets = (exercise.sets ?? []).map((set) => ({
        type: set.type,
        time: Number(set.time) || 0,
        wait: Number(set.wait) || 0,
        weight: Number(set.weight) || 0,
      }))
      sets.note = exercise.note ?? ''
      sets.trackWeight = exercise.trackWeight !== false
      exerciseAcc[exercise.name] = sets
      return exerciseAcc
    }, {})

    acc[session.name] = exercises
    return acc
  }, {})
}

export function createDefaultSet() {
  return {
    type: 'entrainement',
    time: 60,
    wait: 180,
    weight: 0,
  }
}

export function createDefaultExercise() {
  return {
    name: '',
    note: '',
    trackWeight: true,
    sets: [createDefaultSet()],
  }
}
