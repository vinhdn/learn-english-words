import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3, BookHeart, BookOpen, CalendarDays, Check, ChevronRight, Clock3, Download,
  Ear, Heart, Home, Lightbulb, LockKeyhole, Map, Menu, Mic2, Play, RotateCcw, Search, Settings2,
  ShieldCheck, Sparkles, Sprout, Star, Volume2, X,
} from 'lucide-react'
import { CATEGORY_LABELS, WEEKS, WORDS, lessonsForWeek, nextLessonAfter, sessionWordsForLesson } from './data/curriculum'
import { AccountPanel, type SyncStatus } from './components/AccountPanel'
import { LearnSession } from './components/LearnSession'
import { WordIllustration } from './components/WordIllustration'
import { ApiError, getCloudProgress, getCurrentUser, saveCloudProgress, type AuthUser } from './lib/api'
import { speakEnglish } from './lib/speech'
import { clearState, loadState, makeSessionRecord, mergeLearningStates, saveState, updateWordProgress } from './lib/storage'
import type { AppPage, LearningLesson, LearningState, LearningWord, WordCategory } from './types'

const NAV_ITEMS: { id: AppPage; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Hôm nay', icon: Home },
  { id: 'library', label: 'Từ của con', icon: BookOpen },
  { id: 'roadmap', label: 'Lộ trình', icon: Map },
  { id: 'parents', label: 'Phụ huynh', icon: Settings2 },
]

function masteryLabel(level: number) {
  if (level >= 3) return 'Đã vững'
  if (level === 2) return 'Đang nhớ'
  if (level === 1) return 'Mới gặp'
  return 'Chưa học'
}

function App() {
  const [state, setState] = useState<LearningState>(loadState)
  const [page, setPage] = useState<AppPage>('home')
  const [inSession, setInSession] = useState(false)
  const [activeSessionWords, setActiveSessionWords] = useState<LearningWord[]>([])
  const [activeSessionLesson, setActiveSessionLesson] = useState<LearningLesson | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const cloudVersion = useRef(0)

  useEffect(() => saveState(state), [state])

  const hydrateAccount = async (user: AuthUser, localState = state) => {
    setSyncStatus('loading')
    try {
      const remote = await getCloudProgress()
      cloudVersion.current = remote.version
      const merged = remote.state ? mergeLearningStates(localState, remote.state) : localState
      setState(merged)
      const saved = await saveCloudProgress(merged, remote.version)
      cloudVersion.current = saved.version
      setAuthUser(user)
      setSyncStatus('synced')
    } catch {
      setAuthUser(user)
      setSyncStatus('offline')
    }
  }

  useEffect(() => {
    let active = true
    void getCurrentUser()
      .then(async (user) => {
        if (!active) return
        if (user) await hydrateAccount(user)
        else setAuthUser(null)
      })
      .catch(() => {
        if (active) setSyncStatus('offline')
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })
    return () => { active = false }
    // Run once: state is the local snapshot loaded at startup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!authUser) return
    const timer = window.setTimeout(async () => {
      setSyncStatus('saving')
      try {
        const saved = await saveCloudProgress(state, cloudVersion.current)
        cloudVersion.current = saved.version
        setSyncStatus('synced')
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          try {
            const remote = await getCloudProgress()
            const merged = remote.state ? mergeLearningStates(state, remote.state) : state
            const saved = await saveCloudProgress(merged, remote.version)
            cloudVersion.current = saved.version
            setState(merged)
            setSyncStatus('synced')
            return
          } catch {
            setSyncStatus('error')
            return
          }
        }
        setSyncStatus(navigator.onLine ? 'error' : 'offline')
      }
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [authUser, state])

  const handleAuthenticated = async (user: AuthUser) => {
    setAuthLoading(true)
    await hydrateAccount(user)
    setAuthLoading(false)
  }

  const handleLoggedOut = () => {
    setAuthUser(null)
    cloudVersion.current = 0
    setSyncStatus('idle')
  }

  const syncNow = async () => {
    if (!authUser) return
    await hydrateAccount(authUser)
  }

  const currentWeek = WEEKS.find((week) => week.week === state.selectedWeek) ?? WEEKS[0]
  const weekLessons = lessonsForWeek(state.selectedWeek)
  const completedLessonIds = useMemo(
    () => new Set(state.sessions.flatMap((session) => session.lessonId ? [session.lessonId] : [])),
    [state.sessions],
  )
  const currentLesson =
    weekLessons.find((lesson) => lesson.id === state.selectedLessonId) ??
    weekLessons.find((lesson) => !completedLessonIds.has(lesson.id)) ??
    weekLessons[weekLessons.length - 1]
  const sessionWords = useMemo(
    () => sessionWordsForLesson(currentLesson, state.wordProgress),
    [currentLesson, state.wordProgress],
  )

  const recordWord = (wordId: string, result?: boolean) => {
    setState((previous) => ({
      ...previous,
      wordProgress: {
        ...previous.wordProgress,
        [wordId]: updateWordProgress(previous.wordProgress[wordId], result),
      },
    }))
  }

  const completeSession = (correct: number, durationSeconds: number) => {
    const finishedLesson = activeSessionLesson ?? currentLesson
    setState((previous) => {
      const wasCompleted = previous.sessions.some((session) => session.lessonId === finishedLesson.id)
      const completedIds = new Set([
        ...previous.sessions.flatMap((session) => session.lessonId ? [session.lessonId] : []),
        finishedLesson.id,
      ])
      const nextLesson = wasCompleted ? undefined : nextLessonAfter(finishedLesson, completedIds)

      return {
        ...previous,
        selectedWeek: nextLesson?.week ?? finishedLesson.week,
        selectedLessonId: nextLesson?.id ?? finishedLesson.id,
        sessions: [
          ...previous.sessions,
          makeSessionRecord(
            finishedLesson.week,
            finishedLesson.id,
            activeSessionWords.length,
            correct,
            durationSeconds,
          ),
        ].slice(-90),
      }
    })
  }

  const navigate = (next: AppPage) => {
    setPage(next)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const startSession = () => {
    setActiveSessionWords(sessionWords)
    setActiveSessionLesson(currentLesson)
    setInSession(true)
  }

  const exitSession = () => {
    setInSession(false)
    setActiveSessionWords([])
    setActiveSessionLesson(null)
  }

  const selectLesson = (lessonId: string) => {
    setState((previous) => ({ ...previous, selectedLessonId: lessonId }))
  }

  if (inSession && activeSessionLesson) {
    return (
      <LearnSession
        week={currentWeek}
        lesson={activeSessionLesson}
        words={activeSessionWords}
        settings={state.settings}
        onRecord={recordWord}
        onComplete={completeSession}
        onExit={exitSession}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={() => navigate('home')} type="button" aria-label="Về trang hôm nay">
            <span className="brand-mark"><Sprout aria-hidden="true" /></span>
            <span><strong>Vườn Từ Vựng</strong><small>15 phút mỗi ngày</small></span>
          </button>
          <nav className="desktop-nav" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => navigate(item.id)} type="button" aria-current={page === item.id ? 'page' : undefined}><Icon aria-hidden="true" />{item.label}</button>
            })}
          </nav>
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenuOpen((open) => !open)} aria-expanded={mobileMenuOpen} aria-label="Mở menu" type="button">
            {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="mobile-menu" aria-label="Điều hướng trên điện thoại">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => navigate(item.id)} type="button"><Icon aria-hidden="true" />{item.label}</button>
            })}
          </nav>
        )}
      </header>

      <main id="main-content" className="main-content">
        {page === 'home' && <HomePage state={state} week={currentWeek} lesson={currentLesson} lessons={weekLessons} completedLessonIds={completedLessonIds} sessionWords={sessionWords} onSelectLesson={selectLesson} onStart={startSession} onNavigate={navigate} />}
        {page === 'library' && <LibraryPage state={state} />}
        {page === 'roadmap' && <RoadmapPage state={state} onSelectWeek={(week) => { setState((previous) => ({ ...previous, selectedWeek: week, selectedLessonId: undefined })); navigate('home') }} />}
        {page === 'parents' && <ParentsPage state={state} setState={setState} authUser={authUser} authLoading={authLoading} syncStatus={syncStatus} onAuthenticated={handleAuthenticated} onLoggedOut={handleLoggedOut} onSyncNow={syncNow} />}
      </main>

      <nav className="bottom-nav" aria-label="Điều hướng nhanh">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => navigate(item.id)} type="button" aria-current={page === item.id ? 'page' : undefined}><Icon aria-hidden="true" /><span>{item.label}</span></button>
        })}
      </nav>

      <footer className="site-footer">
        <Sprout aria-hidden="true" />
        <span>Học ít một, nhớ lâu hơn.</span>
        <span className="privacy-note"><LockKeyhole aria-hidden="true" /> Lưu trên máy hoặc đồng bộ bằng tài khoản phụ huynh.</span>
      </footer>
    </div>
  )
}

interface HomePageProps {
  state: LearningState
  week: (typeof WEEKS)[number]
  lesson: LearningLesson
  lessons: LearningLesson[]
  completedLessonIds: Set<string>
  sessionWords: LearningWord[]
  onSelectLesson: (lessonId: string) => void
  onStart: () => void
  onNavigate: (page: AppPage) => void
}

function HomePage({ state, week, lesson, lessons, completedLessonIds, sessionWords, onSelectLesson, onStart, onNavigate }: HomePageProps) {
  const mastered = Object.values(state.wordProgress).filter((progress) => progress.mastery >= 3).length
  const seen = Object.keys(state.wordProgress).length
  const recentSessions = state.sessions.filter((session) => Date.now() - new Date(session.date).getTime() < 7 * 86_400_000)
  const sessionsThisWeek = recentSessions.length
  const weekWords = WORDS.filter((word) => word.week === state.selectedWeek)
  const weekMastered = weekWords.filter((word) => (state.wordProgress[word.id]?.mastery ?? 0) >= 3).length
  const weekProgress = weekWords.length ? Math.round((weekMastered / weekWords.length) * 100) : 0
  const isReplay = completedLessonIds.has(lesson.id)

  return (
    <div className="page home-page">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="eyebrow"><CalendarDays aria-hidden="true" /> Tuần {week.week} · Giai đoạn {week.stage}</span>
          <h1>Chào {state.settings.childName}!<br /><span>{isReplay ? `Mình ôn lại Buổi ${lesson.order} nhé.` : `Mình học Buổi ${lesson.order} nhé.`}</span></h1>
          <p><strong>{lesson.title}</strong> · {lesson.description}</p>
          <div className="hero-actions">
            <button className="primary-button large" onClick={onStart} type="button">{isReplay ? <RotateCcw aria-hidden="true" /> : <Play fill="currentColor" aria-hidden="true" />} {isReplay ? 'Học lại bài này' : 'Bắt đầu học'}</button>
            <span><Clock3 aria-hidden="true" /> Nội dung khoảng 10–15 phút</span>
          </div>
        </div>
        <div className="hero-garden" aria-hidden="true">
          <span className="sun-shape" />
          <span className="cloud-shape cloud-one" />
          <span className="cloud-shape cloud-two" />
          <div className="garden-book"><BookHeart /><span>Aa</span></div>
          <span className="hill hill-one" />
          <span className="hill hill-two" />
          <span className="sprout-shape"><Sprout /></span>
        </div>
      </section>

      <section className="today-section" aria-labelledby="today-title">
        <div className="section-heading">
          <div><span className="eyebrow">Phiên học hôm nay</span><h2 id="today-title">5 chặng nhỏ, vừa sức</h2></div>
          <button className="text-button" onClick={() => onNavigate('roadmap')} type="button">Xem lộ trình <ChevronRight aria-hidden="true" /></button>
        </div>
        <div className="lesson-route">
          {[
            { icon: Ear, time: '2 phút', title: 'Khởi động', text: '3 lượt nghe và ghép âm' },
            { icon: Sparkles, time: '3 phút', title: 'Khám phá', text: `${sessionWords.length} từ bằng hình, cụm và câu` },
            { icon: Mic2, time: '2 phút', title: 'Nói & làm', text: 'Nói lại và vận động với cả 6 từ' },
            { icon: Volume2, time: '2 phút', title: 'Nghe & chọn', text: '6 câu nghe rồi chọn đúng hình' },
            { icon: BookOpen, time: '2 phút', title: 'Nghe & viết', text: 'Nghe chính tả và điền 3 từ' },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <article className="route-card" key={item.title}>
                <span className="route-number">{index + 1}</span>
                <span className="route-icon"><Icon aria-hidden="true" /></span>
                <small>{item.time}</small><h3>{item.title}</h3><p>{item.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="week-lessons-section" aria-labelledby="week-lessons-title">
        <div className="section-heading">
          <div><span className="eyebrow">Chi tiết tuần {week.week} · 12 từ</span><h2 id="week-lessons-title">5 buổi học trong tuần</h2></div>
          <span className={`next-lesson-label${isReplay ? ' replay' : ''}`}>{isReplay ? <RotateCcw aria-hidden="true" /> : <Sparkles aria-hidden="true" />} {isReplay ? `Đang ôn lại: Buổi ${lesson.order}` : `Tiếp theo: Buổi ${lesson.order}`}</span>
        </div>
        <div className="weekly-lesson-list">
          {lessons.map((item) => {
            const completed = completedLessonIds.has(item.id)
            const active = item.id === lesson.id
            return (
              <button
                key={item.id}
                className={`lesson-plan-card${active ? ' active' : ''}${completed ? ' completed' : ''}`}
                onClick={() => onSelectLesson(item.id)}
                type="button"
                aria-current={active ? 'step' : undefined}
              >
                <span className="lesson-plan-status">{completed ? <Check aria-hidden="true" /> : item.order}</span>
                <span className="lesson-plan-copy"><small>{completed ? (active ? 'Đang chọn để học lại' : 'Đã học · Chọn để ôn') : active ? 'Bài tiếp theo' : `Buổi ${item.order}`}</small><strong>{item.title}</strong><span>{item.focus}</span></span>
                {completed ? <RotateCcw aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
              </button>
            )
          })}
        </div>
        <div className="selected-lesson-detail">
          <div><span className="eyebrow">Buổi {lesson.order} · {lesson.durationMinutes} phút{isReplay ? ' · Đã học' : ''}</span><h3>{lesson.title}</h3><p>{isReplay ? 'Con đã học bài này. Mình có thể ôn lại bất cứ lúc nào để nhớ lâu hơn.' : lesson.description}</p></div>
          <button className="primary-button" onClick={onStart} type="button">{isReplay ? <RotateCcw aria-hidden="true" /> : <Play fill="currentColor" aria-hidden="true" />} {isReplay ? 'Học lại bài này' : 'Học bài này'}</button>
        </div>
      </section>

      <section className="preview-section" aria-labelledby="preview-title">
        <div className="section-heading">
          <div><span className="eyebrow">Hạt giống hôm nay</span><h2 id="preview-title">Con sẽ gặp những từ này</h2></div>
        </div>
        <div className="word-preview-row">
          {sessionWords.map((word) => (
            <button key={word.id} className="preview-word" onClick={() => void speakEnglish(word.english, state.settings.speechRate, `${word.id}-word`)} type="button" aria-label={`Nghe từ ${word.english}`}>
              <WordIllustration word={word} compact />
              <strong lang="en">{word.english}</strong>
              <Volume2 aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Tiến độ học">
        <article className="progress-card">
          <div className="progress-ring" style={{ '--progress': `${weekProgress * 3.6}deg` } as React.CSSProperties}>
            <span><strong>{weekProgress}%</strong><small>tuần {week.week}</small></span>
          </div>
          <div><span className="eyebrow">Tiến độ nhẹ nhàng</span><h2>Mỗi ngày một chút</h2><p>{weekMastered}/{weekWords.length || sessionWords.length} từ tuần này đã vững. Không cần học bù hay chạy đua.</p></div>
        </article>
        <article className="parent-tip-card">
          <span className="tip-icon"><Lightbulb aria-hidden="true" /></span>
          <div><span className="eyebrow">Gợi ý cho bố mẹ</span><h2>Đưa từ ra đời thật</h2><p>{week.parentTip}</p></div>
        </article>
        <article className="mini-stat-card"><BarChart3 aria-hidden="true" /><strong>{seen}</strong><span>từ đã gặp</span></article>
        <article className="mini-stat-card"><Star aria-hidden="true" /><strong>{mastered}</strong><span>từ đã vững</span></article>
        <article className="mini-stat-card"><Heart aria-hidden="true" /><strong>{sessionsThisWeek}</strong><span>buổi trong 7 ngày</span></article>
      </section>
    </div>
  )
}

function LibraryPage({ state }: { state: LearningState }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<WordCategory | 'all'>('all')
  const filtered = WORDS.filter((word) => {
    const matchesCategory = category === 'all' || word.category === category
    const normalized = query.trim().toLowerCase()
    return matchesCategory && (!normalized || word.english.includes(normalized) || word.vietnamese.toLowerCase().includes(normalized))
  })

  return (
    <div className="page">
      <header className="page-header">
        <span className="eyebrow"><BookOpen aria-hidden="true" /> Thư viện của con</span>
        <h1>Tìm, nghe và ôn lại</h1>
        <p>Mỗi từ đều có cách đọc, ghép âm, cụm từ, câu ngắn và gợi ý vận động.</p>
      </header>
      <div className="library-toolbar">
        <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">Tìm từ</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm cat, màu đỏ…" /></label>
        <label className="select-field"><span className="sr-only">Chọn chủ đề</span><select value={category} onChange={(event) => setCategory(event.target.value as WordCategory | 'all')}><option value="all">Tất cả chủ đề</option>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <span className="result-count">{filtered.length} từ</span>
      </div>
      {filtered.length ? (
        <div className="library-grid">
          {filtered.map((word) => {
            const level = state.wordProgress[word.id]?.mastery ?? 0
            return (
              <article className="library-word-card" key={word.id}>
                <WordIllustration word={word} compact />
                <div className="library-word-main">
                  <span className="topic-tag">{CATEGORY_LABELS[word.category]}</span>
                  <h2 lang="en">{word.english}</h2><span className="ipa" lang="en">{word.ipa}</span>
                  <p>{word.vietnamese}</p><small lang="en">{word.phrase}</small>
                </div>
                <button className="sound-button icon-only" onClick={() => void speakEnglish(word.english, state.settings.speechRate, `${word.id}-word`)} type="button" aria-label={`Nghe từ ${word.english}`}><Volume2 aria-hidden="true" /></button>
                <div className="mastery-status" aria-label={masteryLabel(level)}><span>{[1, 2, 3].map((dot) => <i key={dot} className={dot <= level ? 'filled' : ''} />)}</span><small>{masteryLabel(level)}</small></div>
              </article>
            )
          })}
        </div>
      ) : <div className="empty-state"><Search aria-hidden="true" /><h2>Chưa tìm thấy từ</h2><p>Thử một từ hoặc chủ đề khác nhé.</p></div>}
    </div>
  )
}

function RoadmapPage({ state, onSelectWeek }: { state: LearningState; onSelectWeek: (week: number) => void }) {
  const stages = [
    { id: 1, weeks: 'Tuần 1–4', title: 'Xây lại nền móng', description: 'Âm vị CVC, màu sắc, số, gia đình và trường học.' },
    { id: 2, weeks: 'Tuần 5–8', title: 'Mở rộng thế giới', description: 'Sight words, động vật, thức ăn và cơ thể.' },
    { id: 3, weeks: 'Tuần 9–12', title: 'Nói bằng hành động', description: 'Động từ, cảm xúc, nhà cửa và ôn tích hợp.' },
    { id: 4, weeks: 'Tuần 13+', title: 'Tự tin kể chuyện', description: 'Mini-project 2–3 câu theo bài học trên lớp.' },
  ]

  return (
    <div className="page roadmap-page">
      <header className="page-header">
        <span className="eyebrow"><Map aria-hidden="true" /> Lộ trình 3–4 tháng · 12 từ mỗi tuần</span>
        <h1>Đi từ nền tảng đến tự tin</h1>
        <p>Mỗi tuần là một khu vườn 12 từ, chia thành hai nhóm 6 từ vừa sức. Bố mẹ có thể chọn tuần hoặc mở lại bất kỳ bài đã học.</p>
      </header>
      <div className="stage-list">
        {stages.map((stage) => (
          <section className="stage-card" key={stage.id}>
            <div className="stage-intro"><span className="stage-number">{stage.id}</span><span className="eyebrow">Giai đoạn {stage.id} · {stage.weeks}</span><h2>{stage.title}</h2><p>{stage.description}</p></div>
            <div className="week-list">
              {WEEKS.filter((week) => week.stage === stage.id).map((week) => {
                const isCurrent = week.week === state.selectedWeek
                const words = WORDS.filter((word) => word.week === week.week)
                const mastered = words.filter((word) => (state.wordProgress[word.id]?.mastery ?? 0) >= 3).length
                return (
                  <button key={week.week} className={`week-card${isCurrent ? ' current' : ''}`} onClick={() => onSelectWeek(week.week)} type="button">
                    <span className="week-index">Tuần {week.week}</span>
                    <span className="week-copy"><strong>{week.title}</strong><small>{week.subtitle}</small></span>
                    <span className="week-progress">{mastered}/{words.length || 'ôn'}<ChevronRight aria-hidden="true" /></span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function ParentsPage({
  state,
  setState,
  authUser,
  authLoading,
  syncStatus,
  onAuthenticated,
  onLoggedOut,
  onSyncNow,
}: {
  state: LearningState
  setState: React.Dispatch<React.SetStateAction<LearningState>>
  authUser: AuthUser | null
  authLoading: boolean
  syncStatus: SyncStatus
  onAuthenticated: (user: AuthUser) => Promise<void>
  onLoggedOut: () => void
  onSyncNow: () => Promise<void>
}) {
  const mastered = Object.values(state.wordProgress).filter((progress) => progress.mastery >= 3).length
  const totalMinutes = state.sessions.reduce((total, session) => total + session.durationMinutes, 0)
  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vuon-tu-vung-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
  const reset = () => {
    if (window.confirm('Xóa toàn bộ tiến độ trên thiết bị này? Thao tác này không thể hoàn tác.')) setState(clearState())
  }

  return (
    <div className="page parents-page">
      <header className="page-header">
        <span className="eyebrow"><ShieldCheck aria-hidden="true" /> Góc phụ huynh</span>
        <h1>Đồng hành nhẹ nhàng</h1>
        <p>Điều chỉnh phiên học, xem tiến độ và đăng nhập để tiếp tục trên mọi thiết bị. Bé vẫn có thể học không cần tài khoản.</p>
      </header>
      <AccountPanel
        user={authUser}
        loading={authLoading}
        syncStatus={syncStatus}
        onAuthenticated={onAuthenticated}
        onLoggedOut={onLoggedOut}
        onSyncNow={onSyncNow}
      />
      <div className="parent-layout">
        <section className="settings-card" aria-labelledby="settings-title">
          <div className="card-heading"><Settings2 aria-hidden="true" /><div><h2 id="settings-title">Cài đặt học</h2><p>Áp dụng ngay cho phiên tiếp theo.</p></div></div>
          <label className="setting-row"><span><strong>Tên gọi của bé</strong><small>Hiển thị trong lời chào</small></span><input value={state.settings.childName} maxLength={20} onChange={(event) => setState((previous) => ({ ...previous, settings: { ...previous.settings, childName: event.target.value || 'Con' } }))} /></label>
          <div className="setting-row"><span><strong>Thời lượng</strong><small>Khuyến nghị 15–20 phút</small></span><div className="segmented-control">{([15, 20] as const).map((minutes) => <button key={minutes} className={state.settings.sessionMinutes === minutes ? 'active' : ''} onClick={() => setState((previous) => ({ ...previous, settings: { ...previous.settings, sessionMinutes: minutes } }))} type="button">{minutes} phút</button>)}</div></div>
          <label className="setting-row"><span><strong>Hiện nghĩa tiếng Việt</strong><small>Có thể tắt để ưu tiên hình và tiếng Anh</small></span><input className="switch-input" type="checkbox" checked={state.settings.showVietnamese} onChange={(event) => setState((previous) => ({ ...previous, settings: { ...previous.settings, showVietnamese: event.target.checked } }))} /></label>
          <label className="setting-row range-row"><span><strong>Tốc độ phát âm</strong><small>Chậm ← → tự nhiên</small></span><input type="range" min="0.65" max="1" step="0.05" value={state.settings.speechRate} onChange={(event) => setState((previous) => ({ ...previous, settings: { ...previous.settings, speechRate: Number(event.target.value) } }))} /></label>
          <label className="setting-row"><span><strong>Tuần đang học</strong><small>Chọn theo năng lực hiện tại, không theo ngày</small></span><select value={state.selectedWeek} onChange={(event) => setState((previous) => ({ ...previous, selectedWeek: Number(event.target.value), selectedLessonId: undefined }))}>{WEEKS.map((week) => <option key={week.week} value={week.week}>Tuần {week.week}: {week.title}</option>)}</select></label>
        </section>

        <aside className="parent-side">
          <section className="summary-card">
            <div className="card-heading"><BarChart3 aria-hidden="true" /><div><h2>Tiến độ trên máy này</h2><p>Không so sánh với bạn khác.</p></div></div>
            <div className="summary-stats"><div><strong>{state.sessions.length}</strong><span>phiên học</span></div><div><strong>{totalMinutes}</strong><span>phút học</span></div><div><strong>{mastered}</strong><span>từ đã vững</span></div></div>
          </section>
          <section className="principles-card">
            <span className="eyebrow"><Lightbulb aria-hidden="true" /> 3 điều quan trọng</span>
            <ul><li><Check aria-hidden="true" /><span>Dừng khi bé mệt, kể cả chưa đủ 15 phút.</span></li><li><Check aria-hidden="true" /><span>Khen hành động cụ thể: “Con nghe âm đầu rất kỹ”.</span></li><li><Check aria-hidden="true" /><span>Dùng từ trong lúc chơi thay vì kiểm tra nghĩa.</span></li></ul>
          </section>
          <section className="data-card">
            <span className="eyebrow"><LockKeyhole aria-hidden="true" /> Dữ liệu & riêng tư</span>
            <p>Khi chưa đăng nhập, tiến độ chỉ ở thiết bị này. Khi đăng nhập, tiến độ được mã hóa khi truyền và lưu trong tài khoản phụ huynh trên máy chủ riêng.</p>
            <div className="data-actions"><button className="secondary-button" onClick={exportProgress} type="button"><Download aria-hidden="true" /> Xuất tiến độ</button><button className="danger-text-button" onClick={reset} type="button"><RotateCcw aria-hidden="true" /> Đặt lại</button></div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default App
