import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import cookieParser from 'cookie-parser'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import { z } from 'zod'

const PORT = Number(process.env.PORT || 3000)
const DB_PATH = process.env.DB_PATH || '/data/learning.sqlite'
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'https://learn.22792.me'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const COOKIE_NAME = 'vtv_session'
const SESSION_DAYS = 30

process.umask(0o077)
mkdirSync(dirname(DB_PATH), { recursive: true })
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS progress (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    state_json TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );
`)

const queries = {
  findUser: db.prepare('SELECT id, username, password_hash FROM users WHERE username = ?'),
  createUser: db.prepare('INSERT INTO users (id, username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'),
  createSession: db.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)'),
  findSession: db.prepare(`
    SELECT users.id, users.username
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  deleteExpiredSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  getProgress: db.prepare('SELECT state_json, version, updated_at FROM progress WHERE user_id = ?'),
  saveProgress: db.prepare(`
    INSERT INTO progress (user_id, state_json, version, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      state_json = excluded.state_json,
      version = excluded.version,
      updated_at = excluded.updated_at
  `),
}

const usernameSchema = z.string().trim().min(3, 'Tên đăng nhập cần ít nhất 3 ký tự.').max(40).regex(/^[a-zA-Z0-9._-]+$/, 'Chỉ dùng chữ cái, số, dấu chấm, gạch dưới hoặc gạch ngang.')
const passwordSchema = z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự.').max(128)
const credentialsSchema = z.object({ username: usernameSchema, password: passwordSchema })
const wordProgressSchema = z.object({
  seen: z.number().int().min(0).max(100000),
  correct: z.number().int().min(0).max(100000),
  attempts: z.number().int().min(0).max(100000),
  mastery: z.number().int().min(0).max(3),
  lastSeen: z.string().max(50),
})
const sessionRecordSchema = z.object({
  id: z.string().min(1).max(100),
  date: z.string().max(50),
  week: z.number().int().min(1).max(13),
  lessonId: z.string().max(100).optional(),
  words: z.number().int().min(0).max(100),
  correct: z.number().int().min(0).max(100),
  durationMinutes: z.number().int().min(0).max(180),
})
const learningStateSchema = z.object({
  selectedWeek: z.number().int().min(1).max(13),
  selectedLessonId: z.string().max(100).optional(),
  wordProgress: z.record(z.string().max(120), wordProgressSchema),
  sessions: z.array(sessionRecordSchema).max(500),
  settings: z.object({
    childName: z.string().trim().min(1).max(20),
    sessionMinutes: z.union([z.literal(15), z.literal(20)]),
    showVietnamese: z.boolean(),
    speechRate: z.number().min(0.6).max(1.1),
  }),
})
const saveProgressSchema = z.object({
  state: learningStateSchema,
  baseVersion: z.number().int().min(0).optional(),
})

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function createSession(res, userId) {
  const token = randomBytes(32).toString('base64url')
  const now = new Date().toISOString()
  const expiresAt = Date.now() + SESSION_DAYS * 86_400_000
  queries.createSession.run(hashToken(token), userId, now, expiresAt)
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86_400_000,
  })
}

function getToken(req) {
  const token = req.cookies?.[COOKIE_NAME]
  return typeof token === 'string' && token.length <= 100 ? token : null
}

function requireAuth(req, res, next) {
  const token = getToken(req)
  if (!token) return res.status(401).json({ error: 'Vui lòng đăng nhập.' })
  const user = queries.findSession.get(hashToken(token), Date.now())
  if (!user) {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' })
  }
  req.user = { id: user.id, username: user.username }
  next()
}

function parseOrRespond(schema, value, res) {
  const parsed = schema.safeParse(value)
  if (parsed.success) return parsed.data
  res.status(400).json({ error: parsed.error.issues[0]?.message || 'Dữ liệu không hợp lệ.' })
  return null
}

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json({ limit: '512kb' }))
app.use(cookieParser())
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)
  const origin = req.get('origin')
  if (mutating && origin && origin !== PUBLIC_ORIGIN) return res.status(403).json({ error: 'Origin không hợp lệ.' })
  next()
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Thử quá nhiều lần. Vui lòng đợi 15 phút.' },
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const input = parseOrRespond(credentialsSchema, req.body, res)
    if (!input) return
    if (queries.findUser.get(input.username)) return res.status(409).json({ error: 'Tên đăng nhập đã được sử dụng.' })
    const id = randomUUID()
    const now = new Date().toISOString()
    const passwordHash = await bcrypt.hash(input.password, 12)
    queries.createUser.run(id, input.username, passwordHash, now, now)
    createSession(res, id)
    res.status(201).json({ user: { id, username: input.username } })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const input = parseOrRespond(credentialsSchema, req.body, res)
    if (!input) return
    const user = queries.findUser.get(input.username)
    const valid = user ? await bcrypt.compare(input.password, user.password_hash) : await bcrypt.compare(input.password, '$2b$12$9QqfM18FUvQ2eYUy0HqZkuwzQC/TJoMhKDg8FQ9vQzHZdUN5DMiGW')
    if (!user || !valid) return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' })
    createSession(res, user.id)
    res.json({ user: { id: user.id, username: user.username } })
  } catch (error) {
    next(error)
  }
})

app.post('/api/auth/logout', (req, res) => {
  const token = getToken(req)
  if (token) queries.deleteSession.run(hashToken(token))
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: IS_PRODUCTION, sameSite: 'lax', path: '/' })
  res.status(204).end()
})

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }))

app.get('/api/progress', requireAuth, (req, res) => {
  const row = queries.getProgress.get(req.user.id)
  if (!row) return res.json({ state: null, version: 0, updatedAt: null })
  try {
    res.json({ state: JSON.parse(row.state_json), version: row.version, updatedAt: row.updated_at })
  } catch {
    res.status(500).json({ error: 'Dữ liệu tiến độ không đọc được.' })
  }
})

app.put('/api/progress', requireAuth, (req, res) => {
  const input = parseOrRespond(saveProgressSchema, req.body, res)
  if (!input) return
  const current = queries.getProgress.get(req.user.id)
  const currentVersion = current?.version ?? 0
  if (input.baseVersion !== undefined && input.baseVersion !== currentVersion) {
    return res.status(409).json({
      error: 'Tiến độ đã được cập nhật trên thiết bị khác.',
      state: current ? JSON.parse(current.state_json) : null,
      version: currentVersion,
      updatedAt: current?.updated_at ?? null,
    })
  }
  const version = currentVersion + 1
  const updatedAt = new Date().toISOString()
  queries.saveProgress.run(req.user.id, JSON.stringify(input.state), version, updatedAt)
  res.json({ version, updatedAt })
})

app.use((error, _req, res, _next) => {
  console.error(error instanceof Error ? error.message : error)
  if (String(error?.code).startsWith('SQLITE_CONSTRAINT')) return res.status(409).json({ error: 'Dữ liệu đã tồn tại.' })
  res.status(500).json({ error: 'Máy chủ đang bận. Vui lòng thử lại.' })
})

queries.deleteExpiredSessions.run(Date.now())
setInterval(() => queries.deleteExpiredSessions.run(Date.now()), 6 * 60 * 60 * 1000).unref()

const server = app.listen(PORT, '0.0.0.0', () => console.log(`Learning API listening on ${PORT}`))
const shutdown = () => server.close(() => { db.close(); process.exit(0) })
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
