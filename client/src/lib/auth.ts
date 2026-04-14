import type { AuthSession } from '../types/app'

export const AUTH_STORAGE_KEY = 'pixel-war-auth-session'
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

type AuthApiResponse = {
  token: string
  user: {
    id?: string
    _id?: string
    username: string
    email: string
    isAdmin?: boolean
  }
}

const sessionFromApiResponse = (data: AuthApiResponse): AuthSession => ({
  id: data.user.id ?? data.user._id ?? '',
  username: data.user.username,
  email: data.user.email,
  token: data.token,
  isAdmin: (data.user as { isAdmin?: boolean }).isAdmin ?? false,
})

const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
})

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

  const data = (await response.json()) as AuthApiResponse
  return sessionFromApiResponse(data)
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

  const data = (await response.json()) as AuthApiResponse
  return sessionFromApiResponse(data)
}

export async function getAuthUserByEmail(email: string, token: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/auth/users/by-email?email=${encodeURIComponent(email)}`, {
    headers: authHeader(token),
  })

  if (!response.ok) {
    throw new Error('Utilisateur introuvable.')
  }

  const user = (await response.json()) as { _id?: string; id?: string; username: string; email: string; isAdmin?: boolean }

  return {
    id: user.id ?? user._id ?? '',
    username: user.username,
    email: user.email,
    token,
    isAdmin: user.isAdmin ?? false,
  }
}

export async function getCurrentAuthUser(token: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeader(token),
  })

  if (!response.ok) {
    throw new Error('Session utilisateur introuvable.')
  }

  const user = (await response.json()) as { _id?: string; id?: string; username: string; email: string; isAdmin?: boolean }

  return {
    id: user.id ?? user._id ?? '',
    username: user.username,
    email: user.email,
    token,
    isAdmin: user.isAdmin ?? false,
  }
}

export async function logoutUser(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: authHeader(token),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la deconnexion.')
  }
}

export type Contributions = {
  totalPixels: number
  boards: { _id: string; title?: string; status: string }[]
}

export async function getContributions(token: string): Promise<Contributions> {
  const response = await fetch(`${API_BASE_URL}/auth/me/contributions`, {
    headers: authHeader(token),
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des contributions.')
  }

  return response.json() as Promise<Contributions>
}
