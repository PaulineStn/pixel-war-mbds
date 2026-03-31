import type { Theme } from '../types/app'

type ThemeToggleButtonProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function ThemeToggleButton({ theme, onToggleTheme }: ThemeToggleButtonProps) {
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggleTheme}
      aria-label={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
      title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
    >
      {theme === 'dark' ? (
        <>
          <svg className="theme-icon" viewBox="0 0 24 24" role="presentation" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.2v2.4M12 19.4v2.4M2.2 12h2.4M19.4 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
          </svg>
          <span>MODE CLAIR</span>
        </>
      ) : (
        <>
          <svg className="theme-icon" viewBox="0 0 24 24" role="presentation" aria-hidden="true">
            <path d="M20.2 14.1A8.4 8.4 0 1 1 9.9 3.8a7.2 7.2 0 1 0 10.3 10.3z" />
          </svg>
          <span>MODE SOMBRE</span>
        </>
      )}
    </button>
  )
}
