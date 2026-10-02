import 'dotenv/config'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import { z } from 'zod'
import { authRequired, signToken } from './auth.js'
import { prisma } from './db.js'
import { toSessionPayload } from './serializers.js'

const app = express()

const normalizeOrigin = (origin) => origin?.trim().replace(/\/+$/, '')

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true)
      return
    }

    if (!allowedOrigins.length) {
      callback(null, true)
      return
    }

    const normalizedOrigin = normalizeOrigin(origin)
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true)
      return
    }

    callback(new Error('Not allowed by CORS'))
  },
}

app.use(cors(corsOptions))
app.use(express.json())

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const setSchema = z.object({
  type: z.enum(['echauffement', 'entrainement']),
  time: z.number().int().min(1),
  wait: z.number().int().min(0),
  weight: z.number().min(0).default(0),
})

const exerciseSchema = z.object({
  name: z.string().min(1),
  note: z.string().max(1000).default(''),
  trackWeight: z.boolean().default(true),
  sets: z.array(setSchema).min(1),
})

const sessionSchema = z.object({
  name: z.string().min(1),
  exercises: z.array(exerciseSchema).min(1),
})

const historySchema = z.object({
  sessionId: z.number().int().positive().nullable().optional(),
  sessionName: z.string().min(1),
  durationSeconds: z.number().int().min(0),
  exercisesCompleted: z.number().int().min(0).default(0),
  setsCompleted: z.number().int().min(0).default(0),
})

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.json({ status: 'ok' })
  } catch {
    return res.status(500).json({ status: 'error' })
  }
})

app.post('/auth/register', async (req, res) => {
  const parsed = authSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload' })
  }

  const { email, password } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ message: 'Email already used' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  })

  const token = signToken(user.id)
  return res.status(201).json({ token, user })
})

app.post('/auth/login', async (req, res) => {
  const parsed = authSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload' })
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash)
  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = signToken(user.id)
  return res.json({ token, user: { id: user.id, email: user.email } })
})

app.get('/auth/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, createdAt: true },
  })

  return res.json({ user })
})

app.get('/history', authRequired, async (req, res) => {
  const history = await prisma.workoutHistory.findMany({
    where: { userId: req.userId },
    orderBy: { finishedAt: 'desc' },
  })
  return res.json({ history })
})

app.post('/history', authRequired, async (req, res) => {
  const parsed = historySchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload' })
  }

  const data = parsed.data
  let sessionId = data.sessionId ?? null
  if (sessionId != null) {
    const owned = await prisma.workoutSession.findFirst({
      where: { id: sessionId, userId: req.userId },
      select: { id: true },
    })
    if (!owned) sessionId = null
  }

  const entry = await prisma.workoutHistory.create({
    data: {
      userId: req.userId,
      sessionId,
      sessionName: data.sessionName,
      durationSeconds: data.durationSeconds,
      exercisesCompleted: data.exercisesCompleted,
      setsCompleted: data.setsCompleted,
    },
  })
  return res.status(201).json({ entry })
})

app.get('/sessions', authRequired, async (req, res) => {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: req.userId },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json({ sessions: sessions.map(toSessionPayload) })
})

app.patch('/sessions/:id/favorite', authRequired, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ message: 'Invalid session id' })
  const parsed = z.object({ favorite: z.boolean() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' })

  const existing = await prisma.workoutSession.findFirst({
    where: { id, userId: req.userId },
    select: { id: true },
  })
  if (!existing) return res.status(404).json({ message: 'Session not found' })

  const session = await prisma.workoutSession.update({
    where: { id },
    data: { favorite: parsed.data.favorite },
    include: { exercises: { include: { sets: true } } },
  })
  return res.json({ session: toSessionPayload(session) })
})

app.get('/sessions/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid session id' })
  }

  const session = await prisma.workoutSession.findFirst({
    where: { id, userId: req.userId },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  })

  if (!session) {
    return res.status(404).json({ message: 'Session not found' })
  }

  return res.json({ session: toSessionPayload(session) })
})

app.post('/sessions', authRequired, async (req, res) => {
  const parsed = sessionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload' })
  }

  const { name, exercises } = parsed.data

  const duplicate = await prisma.workoutSession.findFirst({
    where: { userId: req.userId, name },
    select: { id: true },
  })
  if (duplicate) {
    return res.status(409).json({ message: 'Une séance avec ce nom existe déjà.' })
  }

  const session = await prisma.workoutSession.create({
    data: {
      name,
      userId: req.userId,
      exercises: {
        create: exercises.map((exercise, exerciseIndex) => ({
          name: exercise.name,
          note: exercise.note,
          trackWeight: exercise.trackWeight,
          orderIndex: exerciseIndex,
          sets: {
            create: exercise.sets.map((set, setIndex) => ({
              type: set.type,
              time: set.time,
              wait: set.wait,
              weight: set.weight,
              orderIndex: setIndex,
            })),
          },
        })),
      },
    },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  })

  return res.status(201).json({ session: toSessionPayload(session) })
})

app.put('/sessions/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid session id' })
  }

  const parsed = sessionSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload' })
  }

  const existing = await prisma.workoutSession.findFirst({
    where: { id, userId: req.userId },
    select: { id: true },
  })
  if (!existing) {
    return res.status(404).json({ message: 'Session not found' })
  }

  const { name, exercises } = parsed.data

  const duplicate = await prisma.workoutSession.findFirst({
    where: { userId: req.userId, name, NOT: { id } },
    select: { id: true },
  })
  if (duplicate) {
    return res.status(409).json({ message: 'Une séance avec ce nom existe déjà.' })
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.exerciseSet.deleteMany({
      where: { exercise: { sessionId: id } },
    })

    await tx.exercise.deleteMany({
      where: { sessionId: id },
    })

    return tx.workoutSession.update({
      where: { id },
      data: {
        name,
        exercises: {
          create: exercises.map((exercise, exerciseIndex) => ({
            name: exercise.name,
            orderIndex: exerciseIndex,
            sets: {
              create: exercise.sets.map((set, setIndex) => ({
                type: set.type,
                time: set.time,
                wait: set.wait,
                weight: set.weight,
                orderIndex: setIndex,
              })),
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    })
  })

  return res.json({ session: toSessionPayload(updated) })
})

app.delete('/sessions/:id', authRequired, async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid session id' })
  }

  const existing = await prisma.workoutSession.findFirst({
    where: { id, userId: req.userId },
    select: { id: true },
  })
  if (!existing) {
    return res.status(404).json({ message: 'Session not found' })
  }

  await prisma.workoutSession.delete({ where: { id } })
  return res.status(204).send()
})

app.use((error, _req, res, _next) => {
  console.error(error)
  return res.status(500).json({ message: 'Internal server error' })
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  console.log(`API listening on port ${port}`)
})
