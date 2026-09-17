import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, Ear, Hand, Lightbulb, Mic2, Sparkles, Timer, Volume2, X } from 'lucide-react'
import { WORDS } from '../data/curriculum'
import { speakEnglish } from '../lib/speech'
import type { AppSettings, LearningLesson, LearningWeek, LearningWord } from '../types'
import { TraceBoard } from './TraceBoard'
import { WordIllustration } from './WordIllustration'

type Phase = 'warmup' | 'learn' | 'practice' | 'quiz' | 'write' | 'complete'

interface LearnSessionProps {
  week: LearningWeek
  lesson: LearningLesson
  words: LearningWord[]
  settings: AppSettings
  onRecord: (wordId: string, result?: boolean) => void
  onComplete: (correct: number, durationSeconds: number) => void
  onExit: () => void
}

function formatTime(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60)
  const remainder = Math.max(0, seconds) % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

export function LearnSession({ week, lesson, words, settings, onRecord, onComplete, onExit }: LearnSessionProps) {
  const [phase, setPhase] = useState<Phase>('warmup')
  const [warmupIndex, setWarmupIndex] = useState(0)
  const [learnIndex, setLearnIndex] = useState(0)
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [practiceSeconds, setPracticeSeconds] = useState(10)
  const [practiceRunning, setPracticeRunning] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [writeIndex, setWriteIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startTime = useRef(Date.now())
  const completionSent = useRef(false)
  const totalSeconds = settings.sessionMinutes * 60

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (phase !== 'practice' || !practiceRunning) return
    if (practiceSeconds <= 0) {
      setPracticeRunning(false)
      return
    }
    const timer = window.setTimeout(() => setPracticeSeconds((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [phase, practiceRunning, practiceSeconds])

  useEffect(() => {
    if (phase === 'complete' && !completionSent.current) {
      completionSent.current = true
      onComplete(correct, elapsed)
    }
  }, [correct, elapsed, onComplete, phase])

  const questions = useMemo(() => words.map((target, index) => {
    const sameCategory = WORDS.filter((item) => item.category === target.category && item.id !== target.id)
    const distractors = [...words.filter((item) => item.id !== target.id), ...sameCategory]
      .filter((item, position, list) => list.findIndex((entry) => entry.id === item.id) === position)
      .slice(index % 2, index % 2 + 3)
    const options = [target, ...distractors]
    while (options.length < 4) {
      const fallback = WORDS[(index * 7 + options.length) % WORDS.length]
      if (!options.some((item) => item.id === fallback.id)) options.push(fallback)
    }
    return { target, options: [...options].sort((a, b) => (a.id.length + index) % 5 - (b.id.length + index) % 5) }
  }), [words])

  const warmupWords = words.slice(0, 3)
  const currentWarmupWord = warmupWords[warmupIndex] ?? words[0]
  const currentWord = words[learnIndex] ?? words[0]
  const currentPracticeWord = words[practiceIndex] ?? words[0]
  const currentQuestion = questions[questionIndex] ?? questions[0]
  const writingWords = words.slice(0, 3)
  const currentWritingWord = writingWords[writeIndex] ?? words[0]
  const steps: { id: Phase; label: string }[] = [
    { id: 'warmup', label: 'Khởi động' },
    { id: 'learn', label: 'Khám phá' },
    { id: 'practice', label: 'Nói và làm' },
    { id: 'quiz', label: 'Luyện nghe' },
    { id: 'write', label: 'Luyện viết' },
    { id: 'complete', label: 'Hoàn thành' },
  ]
  const activeStep = steps.findIndex((step) => step.id === phase)

  const hear = (text: string, audioKey?: string) => void speakEnglish(text, settings.speechRate, audioKey)

  const nextWarmup = () => {
    onRecord(currentWarmupWord.id)
    if (warmupIndex < warmupWords.length - 1) setWarmupIndex((value) => value + 1)
    else setPhase('learn')
  }

  const nextLearnWord = () => {
    onRecord(currentWord.id)
    if (learnIndex < words.length - 1) setLearnIndex((value) => value + 1)
    else setPhase('practice')
  }

  const beginPractice = () => {
    hear(currentPracticeWord.sentence, `${currentPracticeWord.id}-sentence`)
    setPracticeRunning(true)
  }

  const nextPracticeWord = () => {
    onRecord(currentPracticeWord.id)
    if (practiceIndex < words.length - 1) {
      setPracticeIndex((value) => value + 1)
      setPracticeSeconds(10)
      setPracticeRunning(false)
    } else {
      setPhase('quiz')
    }
  }

  const answer = (wordId: string) => {
    if (selectedAnswer) return
    const isCorrect = wordId === currentQuestion.target.id
    setSelectedAnswer(wordId)
    onRecord(currentQuestion.target.id, isCorrect)
    if (isCorrect) setCorrect((value) => value + 1)
  }

  const nextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((value) => value + 1)
      setSelectedAnswer(null)
    } else {
      setPhase('write')
    }
  }

  const nextWritingWord = () => {
    onRecord(currentWritingWord.id)
    if (writeIndex < writingWords.length - 1) setWriteIndex((value) => value + 1)
    else setPhase('complete')
  }

  return (
    <div className="session-shell">
      <header className="session-header">
        <button className="icon-button" onClick={onExit} aria-label="Thoát phiên học" type="button"><X aria-hidden="true" /></button>
        <div className="session-progress" aria-label={`Bước ${activeStep + 1} trên ${steps.length}`}>
          {steps.map((step, index) => <span key={step.id} className={index <= activeStep ? 'active' : ''} title={step.label} />)}
        </div>
        <div className={`session-timer${elapsed >= totalSeconds ? ' overtime' : ''}`} aria-label={`Thời gian còn lại ${formatTime(totalSeconds - elapsed)}`}>
          <Clock3 aria-hidden="true" /> {elapsed >= totalSeconds ? 'Sắp xong' : formatTime(totalSeconds - elapsed)}
        </div>
      </header>

      <main className="session-main" id="main-content">
        {phase === 'warmup' && currentWarmupWord && (
          <section className="activity-panel warmup-panel animate-in" key={currentWarmupWord.id} aria-labelledby="warmup-title">
            <span className="eyebrow"><Sparkles aria-hidden="true" /> Tuần {week.week} · Khởi động {warmupIndex + 1}/{warmupWords.length} · khoảng 2 phút</span>
            <h1 id="warmup-title">Đánh thức đôi tai</h1>
            <p className="activity-lead">Nghe từ, nhìn cách ghép âm rồi đọc chậm và nhanh cùng nhau.</p>
            <div className="warmup-word-card">
              <WordIllustration word={currentWarmupWord} compact />
              <button className="warmup-sound" onClick={() => hear(currentWarmupWord.english, `${currentWarmupWord.id}-word`)} type="button">
                <Volume2 aria-hidden="true" /><strong lang="en">{currentWarmupWord.english}</strong><span lang="en">{currentWarmupWord.ipa}</span>
              </button>
              <p className="phonics-line" lang="en">{currentWarmupWord.phonics}</p>
            </div>
            <div className="movement-card">
              <Hand aria-hidden="true" />
              <div><strong>Đọc và làm</strong><span>{currentWarmupWord.action}</span></div>
            </div>
            <button className="primary-button large" onClick={nextWarmup} type="button">
              {warmupIndex < warmupWords.length - 1 ? 'Âm tiếp theo' : 'Bắt đầu khám phá'} <ArrowRight aria-hidden="true" />
            </button>
          </section>
        )}

        {phase === 'learn' && currentWord && (
          <section className="activity-panel learn-panel animate-in" key={currentWord.id} aria-labelledby="learn-word">
            <div className="activity-topline">
              <span className="eyebrow">Khám phá · {learnIndex + 1}/{words.length} · khoảng 3 phút</span>
              <span className="micro-copy">Nhìn · Nghe · Nói</span>
            </div>
            <div className="learn-grid">
              <WordIllustration word={currentWord} />
              <div className="word-content">
                <button className="sound-button" onClick={() => hear(currentWord.english, `${currentWord.id}-word`)} type="button" aria-label={`Nghe từ ${currentWord.english}`}>
                  <Volume2 aria-hidden="true" /><span>Nghe từ</span>
                </button>
                <h1 id="learn-word" lang="en">{currentWord.english}</h1>
                <p className="ipa" lang="en">{currentWord.ipa}</p>
                <p className="phonics-line" lang="en">{currentWord.phonics}</p>
                {settings.showVietnamese && <p className="translation">{currentWord.vietnamese}</p>}
                <div className="example-lines">
                  <button onClick={() => hear(currentWord.phrase, `${currentWord.id}-phrase`)} type="button"><Volume2 aria-hidden="true" /><span lang="en">{currentWord.phrase}</span></button>
                  <button onClick={() => hear(currentWord.sentence, `${currentWord.id}-sentence`)} type="button"><Volume2 aria-hidden="true" /><span lang="en">{currentWord.sentence}</span></button>
                </div>
              </div>
            </div>
            <button className="primary-button session-next" onClick={nextLearnWord} type="button">
              {learnIndex < words.length - 1 ? 'Từ tiếp theo' : 'Luyện nói và vận động'} <ArrowRight aria-hidden="true" />
            </button>
          </section>
        )}

        {phase === 'practice' && currentPracticeWord && (
          <section className="activity-panel practice-panel animate-in" key={currentPracticeWord.id} aria-labelledby="practice-title">
            <span className="eyebrow"><Mic2 aria-hidden="true" /> Nói và làm · {practiceIndex + 1}/{words.length} · khoảng 2 phút</span>
            <h1 id="practice-title">Nói to, làm thật</h1>
            <p className="activity-lead">Nghe câu mẫu, nói lại hai lần và làm hành động trong 10 giây.</p>
            <div className="practice-word-card">
              <WordIllustration word={currentPracticeWord} compact />
              <div><strong lang="en">{currentPracticeWord.english}</strong><span lang="en">{currentPracticeWord.sentence}</span></div>
              <button className="sound-button" onClick={() => hear(currentPracticeWord.sentence, `${currentPracticeWord.id}-sentence`)} type="button"><Volume2 aria-hidden="true" /> Nghe câu mẫu</button>
            </div>
            <div className="practice-action-card"><Hand aria-hidden="true" /><div><span>Hành động của con</span><strong>{currentPracticeWord.action}</strong></div></div>
            {practiceSeconds > 0 ? (
              <button className="primary-button large practice-timer-button" onClick={beginPractice} disabled={practiceRunning} type="button">
                <Timer aria-hidden="true" /> {practiceRunning ? `Con nói và làm… ${practiceSeconds}s` : 'Bắt đầu 10 giây'}
              </button>
            ) : (
              <button className="primary-button large" onClick={nextPracticeWord} type="button">
                {practiceIndex < words.length - 1 ? 'Con đã nói xong' : 'Bắt đầu nghe và chọn'} <ArrowRight aria-hidden="true" />
              </button>
            )}
          </section>
        )}

        {phase === 'quiz' && currentQuestion && (
          <section className="activity-panel quiz-panel animate-in" key={currentQuestion.target.id} aria-labelledby="quiz-title">
            <span className="eyebrow"><Ear aria-hidden="true" /> Nghe và chọn · {questionIndex + 1}/{questions.length} · khoảng 2 phút</span>
            <h1 id="quiz-title">Con nghe thấy từ nào?</h1>
            <button className="listen-hero" onClick={() => hear(currentQuestion.target.english, `${currentQuestion.target.id}-word`)} type="button">
              <Volume2 aria-hidden="true" /><span>Chạm để nghe</span>
            </button>
            <div className="answer-grid">
              {currentQuestion.options.map((option) => {
                const isTarget = option.id === currentQuestion.target.id
                const isSelected = option.id === selectedAnswer
                const state = selectedAnswer ? (isTarget ? ' correct' : isSelected ? ' incorrect' : '') : ''
                return (
                  <button key={option.id} className={`answer-card${state}`} onClick={() => answer(option.id)} type="button" disabled={Boolean(selectedAnswer)}>
                    <WordIllustration word={option} compact />
                    <strong lang="en">{option.english}</strong>
                    {state === ' correct' && <Check aria-hidden="true" className="answer-mark" />}
                  </button>
                )
              })}
            </div>
            {selectedAnswer && (
              <div className={selectedAnswer === currentQuestion.target.id ? 'feedback correct' : 'feedback retry'} role="status">
                {selectedAnswer === currentQuestion.target.id ? (
                  <><Check aria-hidden="true" /><span><strong>Chính xác!</strong> Con đã nghe rất kỹ.</span></>
                ) : (
                  <><Lightbulb aria-hidden="true" /><span><strong>Mình nhớ lại nhé:</strong> Đáp án là <b lang="en">{currentQuestion.target.english}</b>.</span></>
                )}
                <button className="primary-button compact" onClick={nextQuestion} type="button">Tiếp tục <ArrowRight aria-hidden="true" /></button>
              </div>
            )}
          </section>
        )}

        {phase === 'write' && currentWritingWord && (
          <section className="activity-panel write-panel animate-in" key={currentWritingWord.id} aria-labelledby="write-title">
            <span className="eyebrow">Viết bằng ngón tay · {writeIndex + 1}/{writingWords.length} · khoảng 2 phút</span>
            <h1 id="write-title">Nhìn kỹ rồi tô theo</h1>
            <button className="write-word-sound" onClick={() => hear(currentWritingWord.english, `${currentWritingWord.id}-word`)} type="button">
              <Volume2 aria-hidden="true" /><strong lang="en">{currentWritingWord.english}</strong><span lang="en">{currentWritingWord.ipa}</span>
            </button>
            <TraceBoard word={currentWritingWord.english} />
            <button className="primary-button" onClick={nextWritingWord} type="button">
              {writeIndex < writingWords.length - 1 ? 'Từ tiếp theo' : 'Con đã viết xong'} <ArrowRight aria-hidden="true" />
            </button>
          </section>
        )}

        {phase === 'complete' && (
          <section className="activity-panel complete-panel animate-in" aria-labelledby="complete-title">
            <div className="celebration-mark"><Sparkles aria-hidden="true" /></div>
            <span className="eyebrow">Buổi {lesson.order} đã hoàn thành</span>
            <h1 id="complete-title">Con đã chăm chỉ lắm!</h1>
            <p className="activity-lead">Con đã hoàn thành 24 lượt nghe, nhìn, nói, vận động và viết bằng tiếng Anh.</p>
            <div className="complete-stats">
              <div><strong>{words.length}</strong><span>từ đã luyện</span></div>
              <div><strong>{correct}/{questions.length}</strong><span>lượt nghe đúng</span></div>
              <div><strong>{Math.max(1, Math.round(elapsed / 60))}</strong><span>phút tập trung</span></div>
            </div>
            <div className="parent-note"><Lightbulb aria-hidden="true" /><span><strong>Bài tiếp theo đã sẵn sàng:</strong> Về trang chủ để bắt đầu buổi kế tiếp khi con muốn.</span></div>
            <button className="primary-button large" onClick={onExit} type="button"><ArrowLeft aria-hidden="true" /> Xem bài tiếp theo</button>
          </section>
        )}
      </main>
    </div>
  )
}
