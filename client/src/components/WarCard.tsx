import type { PixelWar } from '../types/app'

type WarCardProps = {
  war: PixelWar
  featured?: boolean
}

export function WarCard({ war, featured = false }: WarCardProps) {
  const cardClassName = 'war-card' + (featured ? ' featured' : '')

  return (
    <article className={cardClassName}>
      {war.label && <p className="card-tag">{war.label}</p>}
      <h3>{war.codeName}</h3>
      <p className="card-subtitle">{war.subtitle}</p>
      <div className="card-stats">
        <span>
          <strong>{war.pixels}</strong> PIXELS
        </span>
        <span>{war.players} JOUEURS</span>
      </div>
      <div className="card-actions">
        <button className="btn btn-ghost" type="button">
          VIEW ARCHIVE
        </button>
        <button className="btn btn-primary" type="button">
          JOIN WAR
        </button>
      </div>
    </article>
  )
}
