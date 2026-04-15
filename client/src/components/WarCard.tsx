import type { Board } from '../types/app'
import { useState, useEffect } from 'react'

type WarCardProps = {
  board: Board
  featured?: boolean
  onClick?: () => void
}

export function WarCard({ board, featured = false, onClick }: WarCardProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  const cardClassName = 'war-card' + (featured ? ' featured' : '')
  const endTime = new Date(board.endDate).getTime()
  const isFinished = endTime <= now
  const isActive = !isFinished

  const timeRemaining = () => {
    const diff = new Date(board.endDate).getTime() - now
    if (diff <= 0) return 'Terminé'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  return (
    <article className={cardClassName} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {isActive && <p className="card-tag">LIVE</p>}
      <h3>{board.title ?? 'Sans titre'}</h3>
      <p className="card-subtitle">
        Par {board.author?.username ?? '?'} — {board.width}×{board.height} pixels
      </p>
      <div className="card-stats">
        <span>
          Cooldown : <strong>{board.cooldown}s</strong>
        </span>
        <span>{board.allowOverwrite ? 'Overwrite ON' : 'Overwrite OFF'}</span>
      </div>
      {isActive && (
        <div className="card-stats">
          <span>⏱ {timeRemaining()}</span>
        </div>
      )}
      <div className="card-actions">
        {isActive ? (
          <button className="btn btn-primary" type="button" onClick={onClick}>
            REJOINDRE
          </button>
        ) : (
          <button className="btn btn-ghost" type="button" onClick={onClick}>
            VOIR L'ARCHIVE
          </button>
        )}
      </div>
    </article>
  )
}
