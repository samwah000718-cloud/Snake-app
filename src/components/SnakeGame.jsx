import { useEffect, useRef, useState, useCallback } from 'react'

const GRID = 18
const CELL = 24
const CANVAS_SIZE = GRID * CELL
const SESSION_SECONDS = 10 * 60
const TICK_MS_START = 150
const TICK_MS_MIN = 80

const COLORS = {
  bg: '#0f2a1d',
  bgAlt: '#123423',
  grid: 'rgba(243, 234, 217, 0.05)',
  snakeHead: '#d4a24c',
  snakeBody: '#e8c887',
  food: '#e07a5f',
  foodGlow: 'rgba(224, 122, 95, 0.35)',
}

function randomCell(exclude) {
  let cell
  do {
    cell = {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    }
  } while (exclude.some((c) => c.x === cell.x && c.y === cell.y))
  return cell
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function SnakeGame({ onLogout }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const tickRef = useRef(null)
  const directionQueueRef = useRef([])

  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [roundOver, setRoundOver] = useState(false)
  const [sessionOver, setSessionOver] = useState(false)
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS)
  const [started, setStarted] = useState(false)

  const initRound = useCallback(() => {
    const snake = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 },
    ]
    stateRef.current = {
      snake,
      direction: { x: 1, y: 0 },
      food: randomCell(snake),
      speed: TICK_MS_START,
    }
    directionQueueRef.current = []
    setScore(0)
    setRoundOver(false)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const s = stateRef.current

    ctx.fillStyle = COLORS.bg
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    ctx.strokeStyle = COLORS.grid
    ctx.lineWidth = 1
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL, 0)
      ctx.lineTo(i * CELL, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL)
      ctx.lineTo(CANVAS_SIZE, i * CELL)
      ctx.stroke()
    }

    if (!s) return

    const { food, snake } = s
    ctx.fillStyle = COLORS.foodGlow
    ctx.beginPath()
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = COLORS.food
    ctx.beginPath()
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.32, 0, Math.PI * 2)
    ctx.fill()

    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody
      const pad = i === 0 ? 1 : 2
      ctx.beginPath()
      ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 6)
      ctx.fill()
    })
  }, [])

  const step = useCallback(() => {
    const s = stateRef.current
    if (!s) return

    const queued = directionQueueRef.current.shift()
    if (queued) {
      const isReverse = queued.x === -s.direction.x && queued.y === -s.direction.y
      if (!isReverse) s.direction = queued
    }

    const head = s.snake[0]
    const newHead = { x: head.x + s.direction.x, y: head.y + s.direction.y }

    const hitWall = newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID
    const hitSelf = s.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)

    if (hitWall || hitSelf) {
      setRoundOver(true)
      setBestScore((prev) => Math.max(prev, s.snake.length - 3))
      return
    }

    const ateFood = newHead.x === s.food.x && newHead.y === s.food.y
    const newSnake = [newHead, ...s.snake]
    if (ateFood) {
      s.food = randomCell(newSnake)
      s.speed = Math.max(TICK_MS_MIN, s.speed - 3)
      setScore((prev) => prev + 1)
    } else {
      newSnake.pop()
    }
    s.snake = newSnake
    draw()
  }, [draw])

  // Game loop, restarts whenever speed changes or round restarts
  useEffect(() => {
    if (!started || roundOver || sessionOver) {
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }
    tickRef.current = setInterval(step, stateRef.current?.speed ?? TICK_MS_START)
    return () => clearInterval(tickRef.current)
  }, [started, roundOver, sessionOver, score, step])

  // Session countdown, independent of rounds
  useEffect(() => {
    if (!started || sessionOver) return
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          setSessionOver(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [started, sessionOver])

  // Keyboard controls
  useEffect(() => {
    function handleKey(e) {
      const map = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 },
        s: { x: 0, y: 1 },
        a: { x: -1, y: 0 },
        d: { x: 1, y: 0 },
      }
      const dir = map[e.key]
      if (dir) {
        e.preventDefault()
        directionQueueRef.current.push(dir)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  function handleStart() {
    initRound()
    setStarted(true)
    requestAnimationFrame(draw)
  }

  function handleRestartRound() {
    initRound()
    requestAnimationFrame(draw)
  }

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div className="game-scene">
      <header className="game-header">
        <div className="game-brand">
          <span className="game-brand-mark">🐍</span>
          <span>Nationsormen</span>
        </div>
        <div className="game-hud">
          <div className="hud-chip">
            <span className="hud-label">Poäng</span>
            <span className="hud-value">{score}</span>
          </div>
          <div className="hud-chip">
            <span className="hud-label">Bästa</span>
            <span className="hud-value">{bestScore}</span>
          </div>
          <div className={`hud-chip ${timeLeft <= 30 ? 'hud-chip--warn' : ''}`}>
            <span className="hud-label">Tid kvar</span>
            <span className="hud-value hud-value--mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
        <button className="ghost-button" onClick={onLogout}>
          Logga ut
        </button>
      </header>

      <div className="game-board-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="game-canvas"
        />

        {!started && (
          <div className="game-overlay">
            <h2>Redo?</h2>
            <p>Styr med piltangenterna eller WASD. Du har tio minuter på dig totalt.</p>
            <button className="primary-button" onClick={handleStart}>
              Starta spelet
            </button>
          </div>
        )}

        {started && roundOver && !sessionOver && (
          <div className="game-overlay">
            <h2>Ormen tog slut</h2>
            <p>Du fick {score} poäng den här omgången.</p>
            <button className="primary-button" onClick={handleRestartRound}>
              Spela igen
            </button>
          </div>
        )}

        {sessionOver && (
          <div className="game-overlay">
            <h2>Tiden är slut</h2>
            <p>Bästa resultat: {bestScore} poäng. Tack för i kväll.</p>
            <button className="primary-button" onClick={onLogout}>
              Tillbaka till start
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
