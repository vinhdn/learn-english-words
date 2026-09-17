import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw, X } from 'lucide-react'

interface SpellingBoardProps {
  word: string
  ipa: string
  onComplete: (correct: boolean) => void
  onReset?: () => void
}

export function SpellingBoard({ word, ipa, onComplete, onReset }: SpellingBoardProps) {
  const [letters, setLetters] = useState(() => Array.from({ length: word.length }, () => ''))
  const [revealed, setRevealed] = useState(false)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const normalizedWord = word.toLowerCase()
  const answer = letters.join('').toLowerCase()
  const correct = answer === normalizedWord

  useEffect(() => {
    setLetters(Array.from({ length: word.length }, () => ''))
    setRevealed(false)
    inputsRef.current = []
  }, [word])

  const finishIfReady = (nextLetters: string[]) => {
    if (nextLetters.every(Boolean)) {
      const isCorrect = nextLetters.join('').toLowerCase() === normalizedWord
      setRevealed(true)
      onComplete(isCorrect)
    }
  }

  const setLetter = (index: number, value: string) => {
    if (revealed) return
    const character = value.replace(/[^a-zA-Z]/g, '').slice(-1).toLowerCase()
    const nextLetters = [...letters]
    nextLetters[index] = character
    setLetters(nextLetters)
    if (character && index < word.length - 1) inputsRef.current[index + 1]?.focus()
    finishIfReady(nextLetters)
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !letters[index] && index > 0) inputsRef.current[index - 1]?.focus()
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (revealed) return
    const pasted = event.clipboardData.getData('text').replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, word.length)
    if (pasted.length < 2) return
    event.preventDefault()
    const nextLetters = Array.from({ length: word.length }, (_, index) => pasted[index] ?? '')
    setLetters(nextLetters)
    inputsRef.current[Math.min(pasted.length, word.length) - 1]?.focus()
    finishIfReady(nextLetters)
  }

  const reset = () => {
    setLetters(Array.from({ length: word.length }, () => ''))
    setRevealed(false)
    onReset?.()
    inputsRef.current[0]?.focus()
  }

  return (
    <div className="spelling-board">
      <p className="spelling-instruction">Nghe kỹ rồi điền <strong>{word.length} chữ cái</strong></p>
      <div className="spelling-cells" aria-label={`Từ cần viết có ${word.length} chữ cái`}>
        {letters.map((letter, index) => (
          <input
            key={index}
            ref={(element) => { inputsRef.current[index] = element }}
            value={letter}
            onChange={(event) => setLetter(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            maxLength={1}
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            disabled={revealed}
            aria-label={`Chữ cái ${index + 1} trên ${word.length}`}
            className={revealed ? (letter.toLowerCase() === normalizedWord[index] ? 'correct' : 'incorrect') : ''}
          />
        ))}
      </div>

      {!revealed && <p className="spelling-hint">Đáp án sẽ xuất hiện sau khi con điền đủ các ô.</p>}

      {revealed && (
        <div className={`spelling-result ${correct ? 'correct' : 'retry'}`} role="status">
          {correct ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
          <div>
            <span>{correct ? 'Con viết đúng rồi!' : 'Mình kiểm tra lại nhé'}</span>
            <strong lang="en">{word}</strong>
            <small lang="en">{ipa}</small>
          </div>
          {!correct && <button className="text-button" onClick={reset} type="button"><RotateCcw aria-hidden="true" /> Viết lại</button>}
        </div>
      )}
    </div>
  )
}
