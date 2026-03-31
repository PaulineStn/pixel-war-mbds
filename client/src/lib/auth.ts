import type { AuthSession } from '../types/app'

export const AUTH_STORAGE_KEY = 'pixel-war-auth-session'
export const MOCK_EMAIL = 'pixelwar@test.fr'
export const MOCK_PASSWORD = 'pixelwar123'

export function getAuthSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function saveAuthSession(session: AuthSession): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
