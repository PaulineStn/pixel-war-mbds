import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { useAuth } from '../../hooks/useAuth'
import type { Theme } from '../../types/app'
import { getContributions } from '../../lib/auth'

type ProfilePageProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function ProfilePage({ theme, onToggleTheme }: ProfilePageProps) {
  const { isLoggedIn, logout, session } = useAuth()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!session) {
      navigate('/auth')
    }
  }, [session, navigate])

  const { data: contributions, isLoading: loading } = useQuery({
    queryKey: ['contributions'],
    queryFn: () => getContributions(),
    enabled: !!session,
  })

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/gardian.png" alt="Logo Pixel War" />
        </div>

        <nav>
          <Link to="/">CANVAS</Link>
          {isLoggedIn && (
            <Link className="active" to="/profile">
              MON PROFIL
            </Link>
          )}
          {session?.isAdmin && <Link to="/admin">ADMIN</Link>}
        </nav>
      </aside>

      <main className="content profile-content">
        <header className="topbar">
          <div className="topbar-actions">
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

        <section className="profile-header">
          <h1>MON PROFIL</h1>
          {session && (
            <p>
              <strong>{session.username}</strong> — {session.email}
            </p>
          )}
        </section>

        {loading ? (
          <p className="boards-loading">Chargement des statistiques...</p>
        ) : (
          <>
            <section className="profile-stats">
              <article className="stat-card">
                <p>PIXELS PLACÉS</p>
                <strong>{contributions?.totalPixels ?? 0}</strong>
              </article>

              <article className="stat-card">
                <p>BOARDS PARTICIPÉS</p>
                <strong>{contributions?.boards.length ?? 0}</strong>
              </article>
            </section>

            <section className="profile-logs">
              <div className="logs-header">
                <h2>BOARDS PARTICIPÉS</h2>
              </div>

              {contributions && contributions.boards.length > 0 ? (
                <ul>
                  {contributions.boards.map((board) => {
                    const hasValidDate = board.endDate ? new Date(board.endDate).getTime() : NaN;
                    const isActive = board.status === 'active' && !isNaN(hasValidDate) && hasValidDate > now;

                    return (
                      <li key={board._id}>
                        <Link to={`/board/${board._id}`}>
                          {board.title ?? 'Sans titre'}
                        </Link>
                        <span className={`board-status ${isActive ? 'active' : 'finished'}`}>
                          {isActive ? 'EN COURS' : 'TERMINÉ'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="boards-empty">
                  Tu n'as pas encore participé à un PixelBoard.{' '}
                  <Link to="/">Rejoins-en un !</Link>
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
