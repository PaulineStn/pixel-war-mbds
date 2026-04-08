import type { AuthSession } from '../types/app'

export const AUTH_STORAGE_KEY = 'pixel-war-auth-session'
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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

export async function authenticateUser(email: string, password: string): Promise<AuthSession> {
  const normalizedEmail = email.trim().toLowerCase()
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalizedEmail, password }),
  })

  if (!response.ok) {
    let apiMessage = response.status === 401 ? 'Identifiants invalides.' : 'Erreur API auth/login.'
    try {
      const data = (await response.json()) as { message?: string }
      if (data.message) {
        apiMessage = data.message
      }
    } catch {
      // Fallback on generic message when response body is not JSON.
    }
    throw new Error(apiMessage)
  }

  return (await response.json()) as AuthSession
}

export async function createAccount(
  username: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  const normalizedUsername = username.trim()
  const normalizedEmail = email.trim().toLowerCase()
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: normalizedUsername, email: normalizedEmail, password }),
  })

  if (!response.ok) {
    let apiMessage =
      response.status === 409 ? 'Un compte existe deja avec cet email.' : 'Impossible de creer le compte.'
    try {
      const data = (await response.json()) as { message?: string }
      if (data.message) {
        apiMessage = data.message
      }
    } catch {
      // Fallback on generic message when response body is not JSON.
    }
    throw new Error(apiMessage)
  }

  return (await response.json()) as AuthSession
}

export async function getAuthUser(email: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/auth/user?email=${encodeURIComponent(email)}`)

  if (!response.ok) {
    throw new Error('Utilisateur introuvable.')
  }

  const user = (await response.json()) as { _id?: string; id?: string; username: string; email: string }

  return {
    id: user.id ?? user._id ?? '',
    username: user.username,
    email: user.email,
  }
}
