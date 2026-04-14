import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const closeRegister = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      setIsSubmitting(false)
      return
    }

    const result = await register(username, email, password)
    if (!result.ok) {
      setError(result.error)
      setIsSubmitting(false)
      return
    }

    navigate('/profile')
  }

  return (
    <main className="auth-page auth-page-register" onClick={closeRegister}>
      <div className="auth-glow auth-glow-left" aria-hidden="true" />
      <div className="auth-glow auth-glow-right" aria-hidden="true" />

      <section className="auth-panel" onClick={(event) => event.stopPropagation()}>
        <button
          className="auth-close"
          type="button"
          onClick={closeRegister}
          aria-label="Fermer et revenir"
        >
          ×
        </button>
        <img className="auth-logo" src="/gardian.png" alt="Pixel War" />

        <h1>CREATE_ACCOUNT</h1>
        <p>Cree ton operateur pour rejoindre le front Pixel War.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="username">USERNAME</label>
          <input
            id="username"
            name="username"
            type="text"
            placeholder="nom_operateur"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            minLength={3}
            required
          />

          <label htmlFor="email">EMAIL</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="votre@email.fr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">PASSWORD</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          <label htmlFor="confirmPassword">CONFIRM_PASSWORD</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={6}
            required
          />

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={isSubmitting}>
            REJOINDRE LA FACTION
          </button>
        </form>

        <div className="auth-links">
          <Link to="/auth">ALREADY REGISTERED</Link>
          <a href="#">FORGOT PASSWORD</a>
        </div>
      </section>
    </main>
  )
}
