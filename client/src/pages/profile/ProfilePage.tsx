import { useEffect, useState } from 'react'
import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { useAuth } from '../../hooks/useAuth'
import type { Theme } from '../../types/app'
import { getContributions, type Contributions } from '../../lib/auth'

type ProfilePageProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function ProfilePage({ theme, onToggleTheme }: ProfilePageProps) {
  const { isLoggedIn, logout, session } = useAuth()
  const [contributions, setContributions] = useState<Contributions | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      window.location.href = '/auth'
      return
    }

    getContributions(session.token)
      .then(setContributions)
      .catch(() => setContributions({ totalPixels: 0, boards: [] }))
      .finally(() => setLoading(false))
  }, [session?.id])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/gardian.svg" alt="Logo Pixel War" />
        </div>

        <nav>
          <a href="/">CANVAS</a>
          {isLoggedIn && (
            <a className="active" href="/profile">
              MON PROFIL
            </a>
          )}
          {session?.isAdmin && <a href="/admin">ADMIN</a>}
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
              <a className="auth-cta" href="/auth">
                S'AUTHENTIFIER
              </a>
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
                  {contributions.boards.map((board) => (
                    <li key={board._id}>
                      <a href={`/board/${board._id}`}>
                        {board.title ?? 'Sans titre'}
                      </a>
                      <span className={`board-status ${board.status}`}>
                        {board.status === 'active' ? 'EN COURS' : 'TERMINÉ'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="boards-empty">
                  Tu n'as pas encore participé à un PixelBoard.{' '}
                  <a href="/">Rejoins-en un !</a>
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
