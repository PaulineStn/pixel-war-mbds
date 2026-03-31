import { useState } from 'react'
import type { FormEvent } from 'react'
import { MOCK_EMAIL, MOCK_PASSWORD } from '../../lib/auth'
import { useAuth } from '../../hooks/useAuth'

export function AuthPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const closeAuth = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }

    window.location.href = '/'
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = login(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }

    window.location.href = '/profile'
  }

  return (
    <main className="auth-page" onClick={closeAuth}>
      <div className="auth-glow auth-glow-left" aria-hidden="true" />
      <div className="auth-glow auth-glow-right" aria-hidden="true" />

      <section className="auth-panel" onClick={(event) => event.stopPropagation()}>
        <button
          className="auth-close"
          type="button"
          onClick={closeAuth}
          aria-label="Fermer et revenir"
        >
          ×
        </button>
        <img className="auth-logo" src="/gardian.svg" alt="Pixel War" />

        <h1>AUTH_GATE</h1>
        <p>Connecte-toi pour deployer tes pixels sur le front.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">EMAIL</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder={MOCK_EMAIL}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label htmlFor="password">PASSWORD</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <p className="auth-hint">Mock: {MOCK_EMAIL} / {MOCK_PASSWORD}</p>
          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary auth-submit" type="submit">
            ENTER WAR_ROOM
          </button>
        </form>

        <div className="auth-links">
          <a href="#">CREATE ACCOUNT</a>
          <a href="#">FORGOT PASSWORD</a>
        </div>
      </section>
    </main>
  )
}
