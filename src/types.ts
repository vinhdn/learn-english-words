export type WordCategory =
  | 'phonics'
  | 'colors'
  | 'numbers'
  | 'family'
  | 'school'
  | 'sight-words'
  | 'animals'
  | 'food'
  | 'body'
  | 'actions'
  | 'feelings'
  | 'home'

export interface LearningWord {
  id: string
  english: string
  ipa: string
  vietnamese: string
  phrase: string
  sentence: string
  phonics: string
  action: string
  visual: string
  color: string
  category: WordCategory
  stage: 1 | 2 | 3 | 4
  week: number
}

export interface LearningWeek {
  week: number
  stage: 1 | 2 | 3 | 4
  title: string
  subtitle: string
  goal: string
  phonics: string
  topics: WordCategory[]
  parentTip: string
}

export interface WordProgress {
  seen: number
  correct: number
  attempts: number
  mastery: number
  lastSeen: string
}

export interface SessionRecord {
  id: string
  date: string
  week: number
  words: number
  correct: number
  durationMinutes: number
}

export interface AppSettings {
  childName: string
  sessionMinutes: 15 | 20
  showVietnamese: boolean
  speechRate: number
}

export interface LearningState {
  selectedWeek: number
  wordProgress: Record<string, WordProgress>
  sessions: SessionRecord[]
  settings: AppSettings
}

export type AppPage = 'home' | 'library' | 'roadmap' | 'parents'
