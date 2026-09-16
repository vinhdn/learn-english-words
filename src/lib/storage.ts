import type { LearningState, SessionRecord, WordProgress } from '../types'

const STORAGE_KEY = 'vuon-tu-vung-state-v1'

export const defaultState: LearningState = {
  selectedWeek: 1,
  wordProgress: {},
  sessions: [],
  settings: {
    childName: 'Con',
    sessionMinutes: 15,
    showVietnamese: true,
    speechRate: 0.78,
  },
}

export function loadState(): LearningState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const saved = JSON.parse(raw) as Partial<LearningState>
    return {
      ...defaultState,
      ...saved,
      settings: { ...defaultState.settings, ...saved.settings },
      wordProgress: saved.wordProgress ?? {},
      sessions: Array.isArray(saved.sessions) ? saved.sessions.slice(-90) : [],
    }
  } catch {
    return defaultState
  }
}

export function saveState(state: LearningState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // The app remains usable if private browsing blocks storage.
  }
}

export function clearState(): LearningState {
  localStorage.removeItem(STORAGE_KEY)
  return structuredClone(defaultState)
}

export function updateWordProgress(
  previous: WordProgress | undefined,
  result?: boolean,
): WordProgress {
  const attempts = (previous?.attempts ?? 0) + (result === undefined ? 0 : 1)
  const correct = (previous?.correct ?? 0) + (result === true ? 1 : 0)
  const seen = (previous?.seen ?? 0) + 1
  const accuracy = attempts === 0 ? 0 : correct / attempts
  const mastery = Math.min(3, Math.floor(seen / 2) + (accuracy >= 0.75 && attempts >= 2 ? 1 : 0))

  return {
    seen,
    attempts,
    correct,
    mastery,
    lastSeen: new Date().toISOString(),
  }
}

export function makeSessionRecord(
  week: number,
  words: number,
  correct: number,
  durationSeconds: number,
): SessionRecord {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    week,
    words,
    correct,
    durationMinutes: Math.max(1, Math.round(durationSeconds / 60)),
  }
}
