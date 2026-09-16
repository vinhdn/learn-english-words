import { useEffect, useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'

interface TraceBoardProps {
  word: string
}

export function TraceBoard({ word }: TraceBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [typed, setTyped] = useState('')
  const isCorrect = typed.trim().toLowerCase() === word.toLowerCase()

  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const context = canvas.getContext('2d')
    context?.scale(ratio, ratio)
    if (context) {
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 8
      context.strokeStyle = '#2563eb'
    }
  }

  useEffect(() => {
    resizeCanvas()
    const observer = new ResizeObserver(resizeCanvas)
    if (canvasRef.current) observer.observe(canvasRef.current)
    return () => observer.disconnect()
  }, [word])

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    const context = event.currentTarget.getContext('2d')
    const { x, y } = point(event)
    context?.beginPath()
    context?.moveTo(x, y)
  }

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return
    const context = event.currentTarget.getContext('2d')
    const { x, y } = point(event)
    context?.lineTo(x, y)
    context?.stroke()
  }

  const stop = () => {
    drawingRef.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div className="trace-wrap">
      <div className="trace-board">
        <span className="trace-guide" lang="en" aria-hidden="true">{word}</span>
        <canvas
          ref={canvasRef}
          aria-label={`Bảng tập viết từ ${word}`}
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={stop}
          onPointerCancel={stop}
        />
        <button className="icon-button clear-canvas" onClick={clear} aria-label="Xóa bảng viết" type="button">
          <RotateCcw aria-hidden="true" />
        </button>
      </div>
      <label className="spell-field">
        <span>Gõ lại từ con vừa viết</span>
        <span className={`spell-input${isCorrect ? ' correct' : ''}`}>
          <input
            lang="en"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Type here…"
            aria-describedby={isCorrect ? 'spell-success' : undefined}
          />
          {isCorrect && <Check aria-hidden="true" />}
        </span>
      </label>
      <div className="letter-cells" aria-label={`Từ ${word} có ${word.length} chữ cái`}>
        {word.split('').map((letter, index) => <span key={`${letter}-${index}`} lang="en">{letter}</span>)}
      </div>
      {isCorrect && <p className="success-text" id="spell-success" role="status"><Check aria-hidden="true" /> Con viết đúng rồi!</p>}
    </div>
  )
}
