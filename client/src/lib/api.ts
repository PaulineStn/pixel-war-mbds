import axios from 'axios'
import { getAuthSession, clearAuthSession } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor to automatically add the Bearer token
api.interceptors.request.use((config) => {
  const session = getAuthSession()
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }
  return config
})

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      clearAuthSession()
      // Optional: redirect to login if we are not already there
      if (window.location.pathname !== '/auth' && window.location.pathname !== '/register') {
        window.location.href = '/auth'
      }
    }
    return Promise.reject(error)
  }
)
