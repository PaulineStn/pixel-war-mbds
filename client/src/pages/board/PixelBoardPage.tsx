import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
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
const MIN_ZOOM = 0.25
const MAX_ZOOM = 16
const ZOOM_FACTOR = 1.2
const DRAG_THRESHOLD = 4 // px before we consider it a drag

type Tooltip = { x: number; y: number; username: string; placedAt: string } | null
type PixelBoardPageProps = { boardId: string; onBack: () => void }

export function PixelBoardPage({ boardId, onBack }: PixelBoardPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Pan & zoom in refs for sync access in event handlers,
  // mirrored as state to trigger React redraws
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Drag tracking
  const mouseDownRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragOriginRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 })

  const [board, setBoard] = useState<Board | null>(null)
  const [pixels, setPixels] = useState<Pixel[]>([])
  const pixelsRef = useRef<Pixel[]>([])
  const pixelsMapRef = useRef<Map<string, Pixel>>(new Map())

  const [selectedColor, setSelectedColor] = useState(PALETTE[12])
  const selectedColorRef = useRef(PALETTE[12])
  const [tooltip, setTooltip] = useState<Tooltip>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [heatmapData, setHeatmapData] = useState<HeatmapPixel[]>([])
  const heatmapDataRef = useRef<HeatmapPixel[]>([])
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null)
  const hoveredPixelRef = useRef<{ x: number; y: number } | null>(null)
  const showHeatmapRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const session = getAuthSession()
  const isActive = board
    ? board.status === 'active' && new Date(board.endDate) > new Date()
    : false
  const isActiveRef = useRef(false)

  // Keep refs in sync
  useEffect(() => { pixelsRef.current = pixels }, [pixels])
  useEffect(() => { selectedColorRef.current = selectedColor }, [selectedColor])
  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { heatmapDataRef.current = heatmapData }, [heatmapData])
  useEffect(() => { showHeatmapRef.current = showHeatmap }, [showHeatmap])

  // Convert client coords → board pixel coords
  const getBoardCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor((clientX - rect.left - panRef.current.x) / (PIXEL_SIZE * zoomRef.current))
    const y = Math.floor((clientY - rect.top - panRef.current.y) / (PIXEL_SIZE * zoomRef.current))
    return { x, y }
  }, [])

  // Draw the board on the main canvas
  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !board) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x: panX, y: panY } = panRef.current
    const z = zoomRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(z, z)

    if (showHeatmapRef.current) {
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, board.width * PIXEL_SIZE, board.height * PIXEL_SIZE)
      const data = heatmapDataRef.current
      if (data.length > 0) {
        const maxCount = Math.max(...data.map((p) => p.updateCount), 1)
        for (const { x, y, updateCount } of data) {
          const t = updateCount / maxCount
          const r = Math.round(255 * t)
          const g = Math.round(255 * (1 - Math.abs(t - 0.5) * 2))
          const b = Math.round(255 * (1 - t))
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.globalAlpha = 0.4 + 0.6 * t
          ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
        }
        ctx.globalAlpha = 1
      }
    } else {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, board.width * PIXEL_SIZE, board.height * PIXEL_SIZE)

      // Grid only when zoomed in enough
      if (z >= 0.8) {
        ctx.strokeStyle = '#2a2a2a'
        ctx.lineWidth = 0.5 / z
        for (let x = 0; x <= board.width; x++) {
          ctx.beginPath()
          ctx.moveTo(x * PIXEL_SIZE, 0)
          ctx.lineTo(x * PIXEL_SIZE, board.height * PIXEL_SIZE)
          ctx.stroke()
        }
        for (let y = 0; y <= board.height; y++) {
          ctx.beginPath()
          ctx.moveTo(0, y * PIXEL_SIZE)
          ctx.lineTo(board.width * PIXEL_SIZE, y * PIXEL_SIZE)
          ctx.stroke()
        }
      }

      for (const pixel of pixelsRef.current) {
        ctx.fillStyle = pixel.color
        ctx.fillRect(pixel.x * PIXEL_SIZE, pixel.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
      }
    }

    ctx.restore()
  }, [board])

  // Draw hover highlight on overlay canvas
  const drawOverlay = useCallback(() => {
    const overlay = overlayRef.current
    if (!overlay || !board) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, overlay.width, overlay.height)

    const hp = hoveredPixelRef.current
    if (!hp || hp.x < 0 || hp.x >= board.width || hp.y < 0 || hp.y >= board.height) return

    const { x: panX, y: panY } = panRef.current
    const z = zoomRef.current

    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(z, z)

    const px = hp.x * PIXEL_SIZE
    const py = hp.y * PIXEL_SIZE

    if (isActiveRef.current && session) {
      ctx.globalAlpha = 0.5
      ctx.fillStyle = selectedColorRef.current
      ctx.fillRect(px, py, PIXEL_SIZE, PIXEL_SIZE)
      ctx.globalAlpha = 1
    }

    const bw = 1.5 / z
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = bw
    ctx.strokeRect(px + bw / 2, py + bw / 2, PIXEL_SIZE - bw, PIXEL_SIZE - bw)
    const inner = 1 / z
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = inner
    ctx.strokeRect(px + inner * 1.5, py + inner * 1.5, PIXEL_SIZE - inner * 3, PIXEL_SIZE - inner * 3)

    ctx.restore()
  }, [board, session])

  // Redraw main canvas when relevant state changes
  useEffect(() => {
    drawBoard()
  }, [drawBoard, pixels, pan, zoom, showHeatmap, heatmapData])

  // Redraw overlay when hover or color changes
  useEffect(() => {
    hoveredPixelRef.current = hoveredPixel
    drawOverlay()
  }, [drawOverlay, hoveredPixel, selectedColor, pan, zoom])

  // Load board and pixels; set canvas size and center board
  useEffect(() => {
    const load = async () => {
      try {
        const [boardData, pixelsData] = await Promise.all([
          getBoardById(boardId),
          getPixels(boardId),
        ])
        setBoard(boardData)
        setPixels(pixelsData)
        pixelsRef.current = pixelsData
        const map = new Map<string, Pixel>()
        for (const p of pixelsData) map.set(`${p.x},${p.y}`, p)
        pixelsMapRef.current = map

        // Size canvas to fill container, center the board
        const container = containerRef.current
        const canvas = canvasRef.current
        const overlay = overlayRef.current
        if (container && canvas && overlay) {
          const w = container.clientWidth
          const h = container.clientHeight
          canvas.width = w
          canvas.height = h
          overlay.width = w
          overlay.height = h
          const centerX = (w - boardData.width * PIXEL_SIZE) / 2
          const centerY = (h - boardData.height * PIXEL_SIZE) / 2
          panRef.current = { x: centerX, y: centerY }
          setPan({ x: centerX, y: centerY })
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [boardId])

  // Wheel zoom + drag — all in one effect with DOM listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const oldZoom = zoomRef.current
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * factor))
      if (newZoom === oldZoom) return

      // Zoom centered on cursor: keep the board point under cursor fixed
      const { x: panX, y: panY } = panRef.current
      const newPanX = mouseX - (mouseX - panX) * (newZoom / oldZoom)
      const newPanY = mouseY - (mouseY - panY) * (newZoom / oldZoom)

      zoomRef.current = newZoom
      panRef.current = { x: newPanX, y: newPanY }
      setZoom(newZoom)
      setPan({ x: newPanX, y: newPanY })
    }

    const handleMouseDown = (e: MouseEvent) => {
      mouseDownRef.current = true
      isDraggingRef.current = false
      dragOriginRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!mouseDownRef.current) return
      const dx = e.clientX - dragOriginRef.current.mouseX
      const dy = e.clientY - dragOriginRef.current.mouseY
      if (!isDraggingRef.current && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
        isDraggingRef.current = true
        setIsDragging(true)
      }
      if (isDraggingRef.current) {
        const newPan = { x: dragOriginRef.current.panX + dx, y: dragOriginRef.current.panY + dy }
        panRef.current = newPan
        setPan(newPan)
      }
    }

    const handleMouseUp = () => {
      mouseDownRef.current = false
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsDragging(false)
      }
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [board]) // re-runs once board is loaded and canvas is in the DOM

  // Remote pixel via WebSocket
  const handleRemotePixel = useCallback((pixel: Pixel) => {
    const key = `${pixel.x},${pixel.y}`
    pixelsMapRef.current.set(key, pixel)
    setPixels((prev) => {
      const filtered = prev.filter((p) => !(p.x === pixel.x && p.y === pixel.y))
      return [...filtered, pixel]
    })
  }, [])

  useSocket({ boardId, onPixelPlaced: handleRemotePixel })

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldownRemaining])

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
      // Ignore if user was dragging
      if (isDraggingRef.current) return
      if (!board || !session) return
      if (board.status === 'finished' || new Date(board.endDate) < new Date()) return
      if (cooldownRemaining > 0) {
        setError(`Cooldown actif — encore ${cooldownRemaining}s`)
        return
      }

      const coords = getBoardCoords(e.clientX, e.clientY)
      if (!coords) return
      const { x, y } = coords

      try {
        setError(null)
        const newPixel = await placePixel(boardId, x, y, selectedColor, session.token)
        const key = `${x},${y}`
        pixelsMapRef.current.set(key, newPixel)
        setPixels((prev) => {
          const filtered = prev.filter((p) => !(p.x === x && p.y === y))
          return [...filtered, newPixel]
        })
        setCooldownRemaining(board.cooldown)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur.'
        const match = /(\d+) secondes/.exec(msg)
        if (match) setCooldownRemaining(parseInt(match[1], 10))
        setError(msg)
      }
    },
    [board, session, cooldownRemaining, selectedColor, boardId, getBoardCoords],
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDraggingRef.current) return
      const coords = getBoardCoords(e.clientX, e.clientY)
      if (!coords) return
      const { x, y } = coords

      setHoveredPixel({ x, y })

      const pixel = pixelsMapRef.current.get(`${x},${y}`)
      if (pixel?.placedBy) {
        setTooltip({ x: e.clientX, y: e.clientY, username: pixel.placedBy.username, placedAt: new Date(pixel.placedAt).toLocaleString() })
      } else {
        setTooltip(null)
      }
    },
    [getBoardCoords],
  )

  const handleCanvasMouseLeave = useCallback(() => {
    setTooltip(null)
    setHoveredPixel(null)
  }, [])

  const handleToggleHeatmap = useCallback(async () => {
    if (!showHeatmap) {
      const data = await getHeatmap(boardId)
      setHeatmapData(data)
      heatmapDataRef.current = data
    }
    setShowHeatmap((prev) => !prev)
  }, [boardId, showHeatmap])

  const handleExportPNG = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${board?.title ?? 'pixelboard'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [board])

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

  const canvasCursor = isDragging ? 'grabbing' : isActive && session ? 'crosshair' : 'grab'

  return (
    <div className="board-page">
      {/* Header */}
      <div className="board-header">
        <button className="board-back" onClick={onBack}>← Retour</button>
        <button className="board-back" onClick={handleExportPNG} title="Exporter en PNG">↓ PNG</button>
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
            <span className={`board-status ${board.status}`}>{isActive ? 'EN COURS' : 'TERMINÉ'}</span>
            <span className="board-tag">{board.width}×{board.height}</span>
            <span className="board-tag">Cooldown : {board.cooldown}s</span>
            <span className="board-tag">{board.allowOverwrite ? 'Overwrite ON' : 'Overwrite OFF'}</span>
            {isActive && <span className="board-tag board-timer">⏱ {getTimeRemaining()}</span>}
          </div>
        </div>
      </div>

      {error && <div className="board-error-banner">{error}</div>}
      {cooldownRemaining > 0 && (
        <div className="board-cooldown">Prochain pixel dans {cooldownRemaining}s</div>
      )}

      {/* Canvas viewport */}
      <div ref={containerRef} className="board-canvas-wrapper">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          style={{ position: 'absolute', top: 0, left: 0, cursor: canvasCursor, imageRendering: 'pixelated' }}
        />
        <canvas
          ref={overlayRef}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', imageRendering: 'pixelated' }}
        />
      </div>

      {tooltip && (
        <div className="pixel-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}>
          {tooltip.username} — {tooltip.placedAt}
        </div>
      )}

      {isActive && (
        <div className="board-palette-bar">
          {!session && (
            <span className="board-palette-hint">
              <Link to="/auth">Connecte-toi</Link> pour dessiner
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
              <span className="palette-selected-label">Couleur : {selectedColor}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
