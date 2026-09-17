import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Mic, Play, RotateCcw, ShieldCheck, Square, Volume2 } from 'lucide-react'
import { pronunciationFeedback, pronunciationScore } from '../lib/pronunciation'
import { speakEnglish } from '../lib/speech'

interface RecognitionAlternativeLike {
  transcript: string
  confidence: number
}

interface RecognitionEventLike {
  results: ArrayLike<ArrayLike<RecognitionAlternativeLike>>
}

interface RecognitionErrorLike {
  error: string
}

interface RecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: RecognitionEventLike) => void) | null
  onerror: ((event: RecognitionErrorLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionConstructor = new () => RecognitionLike

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor
  webkitSpeechRecognition?: RecognitionConstructor
}

interface PronunciationPracticeProps {
  word: string
  ipa: string
  audioKey: string
  speechRate: number
  onAttempt?: (score: number | null) => void
}

export function PronunciationPractice({ word, ipa, audioKey, speechRate, onAttempt }: PronunciationPracticeProps) {
  const [recording, setRecording] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recognitionRef = useRef<RecognitionLike | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionOutcomeRef = useRef(false)
  const mountedRef = useRef(true)
  const timeoutRef = useRef<number | null>(null)

  const stopMedia = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = null
    const recorder = recorderRef.current
    if (recorder?.state === 'recording') recorder.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setRequesting(false)
    setRecording(false)
  }

  const stopRecording = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      recognitionRef.current?.abort()
    }
    stopMedia()
  }

  useEffect(() => () => {
    mountedRef.current = false
  }, [])

  useEffect(() => () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    recognitionRef.current?.abort()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setTranscript('')
    setScore(null)
    setMessage('')
  }

  const startRecording = async () => {
    reset()
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMessage('Trình duyệt này chưa hỗ trợ ghi âm. Con vẫn có thể nghe và đọc cùng bố mẹ.')
      return
    }

    setRequesting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      setRequesting(false)
      streamRef.current = stream
      chunksRef.current = []
      recognitionOutcomeRef.current = false
      const preferredType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size > 0) setAudioUrl(URL.createObjectURL(blob))
        else setMessage('Bản ghi quá ngắn. Con hãy bấm ghi âm và đọc chậm, rõ hơn nhé.')
      }
      recorder.start()
      setRecording(true)

      const speechWindow = window as SpeechWindow
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
      if (Recognition) {
        const recognition = new Recognition()
        recognitionRef.current = recognition
        recognition.lang = 'en-US'
        recognition.continuous = false
        recognition.interimResults = false
        recognition.maxAlternatives = 1
        recognition.onresult = (event) => {
          recognitionOutcomeRef.current = true
          const heard = event.results[0]?.[0]?.transcript?.trim() ?? ''
          const resultScore = pronunciationScore(word, heard)
          setTranscript(heard)
          setScore(resultScore)
          onAttempt?.(resultScore)
        }
        recognition.onerror = (event) => {
          recognitionOutcomeRef.current = true
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setMessage('Micro đang bị chặn. Bố mẹ hãy cho phép micro trong cài đặt của trình duyệt.')
          } else if (event.error === 'no-speech') {
            setMessage('Chưa nghe thấy giọng con. Hãy đưa tablet gần hơn và thử lại.')
          } else {
            setMessage('Chưa chấm tự động được. Con vẫn có thể nghe lại bản ghi.')
          }
          onAttempt?.(null)
        }
        recognition.onend = () => {
          if (!recognitionOutcomeRef.current) {
            setMessage('Chưa nhận được từ con đọc. Hãy đưa tablet gần hơn và thử lại nhé.')
            onAttempt?.(null)
          }
          stopMedia()
        }
        recognition.start()
      } else {
        recognitionOutcomeRef.current = true
        setMessage('Trình duyệt sẽ ghi âm để nghe lại nhưng chưa hỗ trợ chấm tự động.')
        onAttempt?.(null)
      }

      timeoutRef.current = window.setTimeout(stopRecording, 7000)
    } catch {
      if (!mountedRef.current) return
      setRequesting(false)
      setRecording(false)
      setMessage('Không mở được micro. Bố mẹ hãy kiểm tra quyền micro của trình duyệt.')
    }
  }

  const feedback = score === null ? null : pronunciationFeedback(score)

  return (
    <div className="pronunciation-card">
      <div className="pronunciation-heading">
        <div><span>Đọc theo từ</span><strong lang="en">{word}</strong><small lang="en">{ipa}</small></div>
        <button className="sound-button" onClick={() => void speakEnglish(word, speechRate, audioKey)} type="button"><Volume2 aria-hidden="true" /> Nghe mẫu</button>
      </div>

      {!recording ? (
        <button className="record-button" onClick={() => void startRecording()} disabled={requesting} type="button"><Mic aria-hidden="true" /> {requesting ? 'Đang chờ quyền micro…' : audioUrl ? 'Ghi âm lại' : 'Bắt đầu ghi âm'}</button>
      ) : (
        <button className="record-button recording" onClick={stopRecording} type="button"><Square fill="currentColor" aria-hidden="true" /> Dừng ghi âm</button>
      )}

      {recording && <div className="recording-status" role="status"><span className="recording-dot" /> Đang nghe con đọc… tự dừng sau 7 giây</div>}

      {(audioUrl || feedback || message) && (
        <div className="pronunciation-result" aria-live="polite">
          {feedback && <div className={`score-badge ${feedback.level}`}><strong>{score}%</strong><span>{feedback.label}<small>{feedback.detail}</small></span></div>}
          {transcript && <p>Trình duyệt nghe được: <b lang="en">“{transcript}”</b></p>}
          {message && <p className="recording-message"><AlertCircle aria-hidden="true" /> {message}</p>}
          <div className="recording-actions">
            {audioUrl && <button className="secondary-button" onClick={() => void new Audio(audioUrl).play()} type="button"><Play fill="currentColor" aria-hidden="true" /> Nghe giọng con</button>}
            {(audioUrl || message) && <button className="text-button" onClick={reset} type="button"><RotateCcw aria-hidden="true" /> Làm lại</button>}
          </div>
        </div>
      )}

      <p className="recording-privacy"><ShieldCheck aria-hidden="true" /> Website không lưu file ghi âm. Trình duyệt có thể dùng dịch vụ giọng nói để nhận dạng và chấm điểm tham khảo.</p>
    </div>
  )
}
