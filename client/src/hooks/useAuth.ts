import { clearAuthSession, getAuthSession, saveAuthSession, MOCK_EMAIL, MOCK_PASSWORD } from '../lib/auth'
import type { AuthSession } from '../types/app'

export function useAuth() {
  const session = getAuthSession()
  const isLoggedIn = Boolean(session)

  const login = (email: string, password: string) => {
    if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
      return {
        ok: false as const,
        error: 'Identifiants invalides (mock).',
      }
    }

    const nextSession: AuthSession = { email }
    saveAuthSession(nextSession)

    return {
      ok: true as const,
      session: nextSession,
    }
  }

  const logout = () => {
    clearAuthSession()
  }

  return {
    session,
    isLoggedIn,
    login,
    logout,
  }
}
