import {
  authenticateUser,
  clearAuthSession,
  createAccount,
  getAuthSession,
  logoutUser,
  saveAuthSession,
} from '../lib/auth'
import type { AuthSession } from '../types/app'

export function useAuth() {
  const session = getAuthSession()
  const isLoggedIn = Boolean(session)

  const login = async (email: string, password: string) => {
    try {
      const sessionFromAuth = await authenticateUser(email, password)
      const nextSession: AuthSession = {
        id: sessionFromAuth.id,
        username: sessionFromAuth.username,
        email: sessionFromAuth.email,
        token: sessionFromAuth.token,
      }
      saveAuthSession(nextSession)

      return {
        ok: true as const,
        session: nextSession,
      }
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Erreur lors de la connexion.',
      }
    }
  }

  const logout = async () => {
    const currentToken = session?.token
    clearAuthSession()
    if (!currentToken) {
      return
    }

    try {
      await logoutUser(currentToken)
    } catch {
      // Best effort: local logout is already done.
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      const createdUser = await createAccount(username, email, password)
      const nextSession: AuthSession = {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        token: createdUser.token,
      }
      saveAuthSession(nextSession)

      return {
        ok: true as const,
        session: nextSession,
      }
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : 'Erreur lors de la creation du compte.',
      }
    }
  }

  return {
    session,
    isLoggedIn,
    login,
    register,
    logout,
  }
}
