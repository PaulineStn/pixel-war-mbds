import { useEffect, useRef, useState, useCallback } from 'react'
import type { Board, Pixel } from '../../types/app'
import { getBoardById, getPixels, placePixel, getHeatmap, type HeatmapPixel } from '../../lib/boards'
import { getAuthSession } from '../../lib/auth'
import { useSocket } from '../../hooks/useSocket'

const PALETTE = [
  '#FFFFFF', '#E4E4E4', '#888888', '#222222',
  '#FFA7D1', '#E50000', '#E59500', '#A06A42',
  '#E5D900', '#94E044', '#02BE01', '#00D3DD',
  '#0083C7', '#0000EA', '#CF6EE4', '#820080',
]

const PIXEL_SIZE = 10

type Tooltip = { x: number; y: number; username: string; placedAt: string } | null

type PixelBoardPageProps = {
  boardId: string
  onBack: () => void
}

export function PixelBoardPage({ boardId, onBack }: PixelBoardPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [board, setBoard] = useState<Board | null>(null)
  const [pixels, setPixels] = useState<Pixel[]>([])
  const [selectedColor, setSelectedColor] = useState(PALETTE[12])
  const [tooltip, setTooltip] = useState<Tooltip>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatmapData, setHeatmapData] = useState<HeatmapPixel[]>([])
  const pixelsMapRef = useRef<Map<string, Pixel>>(new Map())

  const session = getAuthSession()

  // Callback appelé par le socket quand un autre utilisateur place un pixel
  const handleRemotePixel = useCallback((pixel: Pixel) => {
    const key = `${pixel.x},${pixel.y}`
    pixelsMapRef.current.set(key, pixel)
    setPixels((prev) => {
      const filtered = prev.filter((p) => !(p.x === pixel.x && p.y === pixel.y))
      return [...filtered, pixel]
    })
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.fillStyle = pixel.color
      ctx.fillRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
    }
  }, [])

  useSocket({ boardId, onPixelPlaced: handleRemotePixel })

  // Load board and pixels
  useEffect(() => {
    const load = async () => {
      try {
        const [boardData, pixelsData] = await Promise.all([
          getBoardById(boardId),
          getPixels(boardId),
        ])
        setBoard(boardData)
        setPixels(pixelsData)
        const map = new Map<string, Pixel>()
        for (const p of pixelsData) {
          map.set(`${p.x},${p.y}`, p)
        }
        pixelsMapRef.current = map
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [boardId])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !board) return

    canvas.width = board.width * PIXEL_SIZE
    canvas.height = board.height * PIXEL_SIZE

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= board.width; x++) {
      ctx.beginPath()
      ctx.moveTo(x * PIXEL_SIZE, 0)
      ctx.lineTo(x * PIXEL_SIZE, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= board.height; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * PIXEL_SIZE)
      ctx.lineTo(canvas.width, y * PIXEL_SIZE)
      ctx.stroke()
    }

    // Pixels
    for (const pixel of pixels) {
      ctx.fillStyle = pixel.color
      ctx.fillRect(
        pixel.x * PIXEL_SIZE,
        pixel.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE,
      )
    }
  }, [board, pixels])

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldownRemaining])

  // Time remaining on board
  const getTimeRemaining = () => {
    if (!board) return ''
    const diff = new Date(board.endDate).getTime() - Date.now()
    if (diff <= 0) return 'Terminé'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  const handleCanvasClick = useCallback(
    async (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!board || !session) return
      if (board.status === 'finished' || new Date(board.endDate) < new Date()) return
      if (cooldownRemaining > 0) {
        setError(`Cooldown actif — encore ${cooldownRemaining}s`)
        return
      }

      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE)
      const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE)

      try {
        setError(null)
        const newPixel = await placePixel(boardId, x, y, selectedColor, session.token)

        // Update map and pixels list
        const key = `${x},${y}`
        pixelsMapRef.current.set(key, newPixel)
        setPixels((prev) => {
          const filtered = prev.filter((p) => !(p.x === x && p.y === y))
          return [...filtered, newPixel]
        })

        // Draw immediately on canvas
        const ctx = canvasRef.current?.getContext('2d')
        if (ctx) {
          ctx.fillStyle = selectedColor
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
        }

        setCooldownRemaining(board.cooldown)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur.'
        // Parse cooldown from server message
        const match = /(\d+) secondes/.exec(msg)
        if (match) {
          setCooldownRemaining(parseInt(match[1], 10))
        }
        setError(msg)
      }
    },
    [board, session, cooldownRemaining, selectedColor, boardId],
  )

  const handleToggleHeatmap = useCallback(async () => {
    if (!showHeatmap) {
      const data = await getHeatmap(boardId)
      setHeatmapData(data)
    }
    setShowHeatmap((prev) => !prev)
  }, [boardId, showHeatmap])

  // Draw heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !board) return

    if (!showHeatmap) {
      // Redraw normal view
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= board.width; x++) {
        ctx.beginPath(); ctx.moveTo(x * PIXEL_SIZE, 0); ctx.lineTo(x * PIXEL_SIZE, canvas.height); ctx.stroke()
      }
      for (let y = 0; y <= board.height; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * PIXEL_SIZE); ctx.lineTo(canvas.width, y * PIXEL_SIZE); ctx.stroke()
      }
      for (const pixel of pixels) {
        ctx.fillStyle = pixel.color
        ctx.fillRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
      }
      return
    }

    // Heatmap: blue (cold) → red (hot)
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    if (heatmapData.length === 0) return
    const maxCount = Math.max(...heatmapData.map((p) => p.updateCount), 1)
    for (const { x, y, updateCount } of heatmapData) {
      const t = updateCount / maxCount
      const r = Math.round(255 * t)
      const g = Math.round(255 * (1 - Math.abs(t - 0.5) * 2))
      const b = Math.round(255 * (1 - t))
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.globalAlpha = 0.4 + 0.6 * t
      ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
    }
    ctx.globalAlpha = 1
  }, [showHeatmap, heatmapData, board, pixels])

  const handleExportPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${board?.title ?? 'pixelboard'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [board])

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE)
      const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE)
      const pixel = pixelsMapRef.current.get(`${x},${y}`)
      if (pixel?.placedBy) {
        setTooltip({
          x: e.clientX,
          y: e.clientY,
          username: pixel.placedBy.username,
          placedAt: new Date(pixel.placedAt).toLocaleString(),
        })
      } else {
        setTooltip(null)
      }
    },
    [],
  )

  if (loading) {
    return (
      <div className="board-page">
        <p className="board-loading">Chargement du PixelBoard...</p>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="board-page">
        <p className="board-error">PixelBoard introuvable.</p>
        <button onClick={onBack}>Retour</button>
      </div>
    )
  }

  const isActive = board.status === 'active' && new Date(board.endDate) > new Date()

  return (
    <div className="board-page">
      {/* Header */}
      <div className="board-header">
        <button className="board-back" onClick={onBack}>
          ← Retour
        </button>
        <button className="board-back" onClick={handleExportPNG} title="Exporter en PNG">
          ↓ PNG
        </button>
        <button
          className={`board-back ${showHeatmap ? 'board-back-active' : ''}`}
          onClick={handleToggleHeatmap}
          title="Heatmap"
        >
          🌡 HEATMAP
        </button>
        <div className="board-meta">
          <h2 className="board-title">{board.title ?? 'PixelBoard sans titre'}</h2>
          <div className="board-tags">
            <span className={`board-status ${board.status}`}>
              {isActive ? 'EN COURS' : 'TERMINÉ'}
            </span>
            <span className="board-tag">{board.width}×{board.height}</span>
            <span className="board-tag">Cooldown : {board.cooldown}s</span>
            <span className="board-tag">
              {board.allowOverwrite ? 'Overwrite ON' : 'Overwrite OFF'}
            </span>
            {isActive && (
              <span className="board-tag board-timer">⏱ {getTimeRemaining()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="board-error-banner">{error}</div>}

      {/* Cooldown bar */}
      {cooldownRemaining > 0 && (
        <div className="board-cooldown">
          Prochain pixel dans {cooldownRemaining}s
        </div>
      )}

      {/* Canvas area */}
      <div className="board-canvas-wrapper">
        <div className="board-canvas-scroll">
          <canvas
            ref={canvasRef}
            onClick={isActive && session ? handleCanvasClick : undefined}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setTooltip(null)}
            style={{
              cursor: isActive && session ? 'crosshair' : 'default',
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pixel-tooltip"
          style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
        >
          {tooltip.username} — {tooltip.placedAt}
        </div>
      )}

      {/* Color picker — only if board is active and user is logged in */}
      {isActive && (
        <div className="board-palette-bar">
          {!session && (
            <span className="board-palette-hint">
              <a href="/auth">Connecte-toi</a> pour dessiner
            </span>
          )}
          {session && (
            <div className="board-palette">
              {PALETTE.map((color) => (
                <button
                  key={color}
                  className={`palette-color ${selectedColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
              <span className="palette-selected-label">
                Couleur : {selectedColor}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
