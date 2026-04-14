import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { WarCard } from '../../components/WarCard'
import { useAuth } from '../../hooks/useAuth'
import type { Theme } from '../../types/app'
import { getBoards, getBoardStats } from '../../lib/boards'

type WarRoomPageProps = {
  theme: Theme
  onToggleTheme: () => void
  onOpenBoard: (boardId: string) => void
}

export function WarRoomPage({ theme, onToggleTheme, onOpenBoard }: WarRoomPageProps) {
  const { isLoggedIn, logout, session } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'active' | 'finished'>('all')

  const { data: boards = [], isLoading: loadingBoards } = useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })

  const { data: stats } = useQuery({
    queryKey: ['boardStats'],
    queryFn: getBoardStats,
  })

  const loading = loadingBoards

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const activeBoards = boards.filter((b) => b.status === 'active')
  const finishedBoards = boards.filter((b) => b.status === 'finished')

  const visibleActive = filter === 'finished' ? [] : activeBoards
  const visibleFinished = filter === 'active' ? [] : finishedBoards

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/gardian.png" alt="Logo Pixel War" />
        </div>

        <nav>
          <Link className="active" to="/">
            CANVAS
          </Link>
          {isLoggedIn && <Link to="/profile">MON PROFIL</Link>}
          {session?.isAdmin && <Link to="/admin">ADMIN</Link>}
        </nav>

        {stats && (
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.totalUsers}</span>
              <span className="stat-label">utilisateurs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalBoards}</span>
              <span className="stat-label">boards</span>
            </div>
          </div>
        )}
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-actions">
            <input
              className="search"
              type="text"
              placeholder="LOCATE_SECTOR..."
              aria-label="Rechercher une zone"
            />
            <ThemeToggleButton theme={theme} onToggleTheme={onToggleTheme} />
            {isLoggedIn ? (
              <button className="logout-cta" type="button" onClick={handleLogout}>
                SE DECONNECTER
              </button>
            ) : (
              <Link className="auth-cta" to="/auth">
                S'AUTHENTIFIER
              </Link>
            )}
          </div>
        </header>

        <section className="hero">
          <h1>WAR ZONES ACTIVES</h1>
          <p>
            Défendez votre territoire et collaborez avec votre faction pour dominer la zone.
          </p>
        </section>

        <section className="list-header">
          <button
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('all')}
          >
            TOUS
          </button>
          <button
            className={`chip ${filter === 'active' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('active')}
          >
            EN COURS
          </button>
          <button
            className={`chip ${filter === 'finished' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('finished')}
          >
            TERMINÉS
          </button>
        </section>

        {loading && <p className="boards-loading">Chargement des boards...</p>}

        {!loading && boards.length === 0 && (
          <p className="boards-empty">Aucun PixelBoard pour l'instant.</p>
        )}

        {visibleActive.length > 0 && (
          <>
            <section className="grid-main">
              {visibleActive.slice(0, 2).map((board, i) => (
                <WarCard
                  key={board._id}
                  board={board}
                  featured={i === 0}
                  onClick={() => onOpenBoard(board._id)}
                />
              ))}
            </section>
            {visibleActive.length > 2 && (
              <div className="grid-archive">
                {visibleActive.slice(2).map((board) => (
                  <WarCard
                    key={board._id}
                    board={board}
                    onClick={() => onOpenBoard(board._id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {visibleFinished.length > 0 && (
          <section className="archive-section">
            <h2>PIXEL WARS TERMINÉS</h2>
            <div className="grid-archive">
              {visibleFinished.map((board) => (
                <WarCard
                  key={board._id}
                  board={board}
                  onClick={() => onOpenBoard(board._id)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
