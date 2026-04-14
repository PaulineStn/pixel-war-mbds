import type { AuthSession } from '../types/app'
import { api } from './api'

export const AUTH_STORAGE_KEY = 'pixel-war-auth-session'

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
  try {
    const { data } = await api.post<AuthApiResponse>('/auth/login', {
      email: normalizedEmail,
      password
    })
    return sessionFromApiResponse(data)
  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      throw new Error(axiosError.response?.data?.message ?? 'Identifiants invalides.')
    }
    throw new Error('Identifiants invalides.')
  }
}

export async function createAccount(
  username: string,
  email: string,
  password: string,
): Promise<AuthSession> {
  const normalizedUsername = username.trim()
  const normalizedEmail = email.trim().toLowerCase()

  try {
    const { data } = await api.post<AuthApiResponse>('/auth/register', {
      username: normalizedUsername,
      email: normalizedEmail,
      password
    })
    return sessionFromApiResponse(data)
  } catch (error) {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } }
      throw new Error(axiosError.response?.data?.message ?? 'Impossible de creer le compte.')
    }
    throw new Error('Impossible de creer le compte.')
  }
}

export async function getAuthUserByEmail(email: string, _token?: string): Promise<AuthSession> {
  try {
    const { data } = await api.get<{ _id?: string; id?: string; username: string; email: string; isAdmin?: boolean }>(
      `/auth/users/by-email?email=${encodeURIComponent(email)}`
    )
    return {
      id: data.id ?? data._id ?? '',
      username: data.username,
      email: data.email,
      token: _token ?? '',
      isAdmin: data.isAdmin ?? false,
    }
  } catch {
    throw new Error('Utilisateur introuvable.')
  }
}

export async function getCurrentAuthUser(_token?: string): Promise<AuthSession> {
  try {
    const { data } = await api.get<{ _id?: string; id?: string; username: string; email: string; isAdmin?: boolean }>('/auth/me')
    return {
      id: data.id ?? data._id ?? '',
      username: data.username,
      email: data.email,
      token: _token ?? '',
      isAdmin: data.isAdmin ?? false,
    }
  } catch {
    throw new Error('Session utilisateur introuvable.')
  }
}

export async function logoutUser(_token?: string): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    throw new Error('Erreur lors de la deconnexion.')
  }
}

export type Contributions = {
  totalPixels: number
  boards: { _id: string; title?: string; status: string }[]
}

export async function getContributions(_token?: string): Promise<Contributions> {
  try {
    const { data } = await api.get<Contributions>('/auth/me/contributions')
    return data
  } catch {
    throw new Error('Erreur lors de la récupération des contributions.')
  }
}
