import { ThemeToggleButton } from '../../components/ThemeToggleButton'
import { WarCard } from '../../components/WarCard'
import { useAuth } from '../../hooks/useAuth'
import type { PixelWar, Theme } from '../../types/app'

type WarRoomPageProps = {
  theme: Theme
  onToggleTheme: () => void
}

const activeWars: PixelWar[] = [
  {
    id: 1,
    codeName: 'CYBER_CITADEL_V4',
    subtitle: 'Frontier sud sous pression. Renforts requis.',
    pixels: '1,429,082',
    players: 4210,
    status: 'active',
    label: 'LIVE_CONFLICT',
  },
  {
    id: 2,
    codeName: 'NEON_VOID',
    subtitle: 'Secteur noyau en montee de trafic.',
    pixels: '452,100',
    players: 1288,
    status: 'active',
    label: 'MOST_ACTIVE',
  },
]

const archivedWars: PixelWar[] = [
  {
    id: 3,
    codeName: 'FRAGMENT_SQUAD',
    subtitle: 'Operation stabilisee apres 72h de conflit.',
    pixels: '128,900',
    players: 640,
    status: 'finished',
  },
  {
    id: 4,
    codeName: 'ORIGIN_ZERO',
    subtitle: 'Session close, replay disponible.',
    pixels: '1,000,000',
    players: 3920,
    status: 'finished',
  },
  {
    id: 5,
    codeName: 'PLASMA_PEAK',
    subtitle: 'Noeud capture, archive verrouillee.',
    pixels: '890,442',
    players: 2054,
    status: 'finished',
  },
]

export function WarRoomPage({ theme, onToggleTheme }: WarRoomPageProps) {
  const { isLoggedIn, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/'
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/gardian.svg" alt="Logo Pixel War" />
        </div>

        <nav>
          <a className="active" href="#">
            CANVAS
          </a>
          {isLoggedIn && <a href="/profile">MON PROFILE</a>}
        </nav>
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
              <a className="auth-cta" href="/auth">
                S'AUTHENTIFIER
              </a>
            )}
          </div>
        </header>

        <section className="hero">
          <h1>
            WAR ZONES ACTIVES
          </h1>
          <p>
            Defendez votre territoire et collaborez avec votre faction pour dominer la zone.
          </p>
        </section>

        <section className="list-header">
          <button className="chip active" type="button">
            FILTER
          </button>
          <button className="chip" type="button">
            MOST_ACTIVE
          </button>
        </section>

        <section className="grid-main">
          <WarCard war={activeWars[0]} featured />
          <WarCard war={activeWars[1]} />
        </section>

        <section className="archive-section">
          <h2>PIXEL WARS TERMINES</h2>
          <div className="grid-archive">
            {archivedWars.map((war) => (
              <WarCard key={war.id} war={war} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
