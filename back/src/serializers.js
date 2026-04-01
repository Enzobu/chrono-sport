export function toSessionPayload(session) {
  return {
    id: session.id,
    name: session.name,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    exercises: session.exercises
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((set) => ({
            id: set.id,
            type: set.type,
            time: set.time,
            wait: set.wait,
            weight: set.weight,
          })),
      })),
  }
}
