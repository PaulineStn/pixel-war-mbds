import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { useAuth } from '../../hooks/useAuth'
import type { Theme } from '../../types/app'

type ProfilePageProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function ProfilePage({ theme, onToggleTheme }: ProfilePageProps) {
  const { isLoggedIn, logout, session } = useAuth()

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
              MON PROFILE
            </a>
          )}
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
          <h1>MON PROFILE</h1>
          <p>
            Statistiques operateur sur tes contributions Pixel War.
            {session ? ` Connecte: ${session.username} (${session.email})` : ''}
          </p>
        </section>

        <section className="profile-grid">
          <article className="profile-card">
            <p className="hero-overline">GLOBAL_RANKING</p>
            <h2>#420</h2>
            <p>Top 0.5% des operateurs.</p>
          </article>

          <article className="profile-card">
            <p className="hero-overline">LEVEL</p>
            <h2>48</h2>
            <p>Prochain palier dans 4,200 PX.</p>
          </article>
        </section>

        <section className="profile-stats">
          <article className="stat-card">
            <p>PIXELS AJOUTES</p>
            <strong>84,291</strong>
          </article>

          <article className="stat-card">
            <p>BOARDS PARTICIPES</p>
            <strong>17</strong>
          </article>
        </section>

        <section className="profile-logs">
          <div className="logs-header">
            <h2>PARTICIPATION_LOGS</h2>
            <a href="#">ARCHIVE_ACCESS &gt;&gt;</a>
          </div>

          <ul>
            <li>
              <span>NEO_TOKYO_DISTRICT_7</span>
              <span>+450 CREDITS</span>
            </li>
            <li>
              <span>VOID_CORE_CHALLENGE</span>
              <span>+1,200 CREDITS</span>
            </li>
            <li>
              <span>CYBER_DOME_BATTLEFIELD</span>
              <span>+280 CREDITS</span>
            </li>
          </ul>
        </section>
      </main>
    </div>
  )
}
