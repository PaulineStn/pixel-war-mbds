import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-glow not-found-glow-left" aria-hidden="true" />
      <div className="not-found-glow not-found-glow-right" aria-hidden="true" />

      <section className="not-found-panel">
        <p className="not-found-overline">ERROR_CODE</p>
        <h1 className="not-found-code">404</h1>
        <p className="not-found-message">Coordonnées inconnues. Ce secteur n'existe pas sur la carte.</p>
        <Link to="/" className="btn btn-primary not-found-cta">
          RETOUR AU WAR_ROOM
        </Link>
      </section>
    </main>
  )
}
