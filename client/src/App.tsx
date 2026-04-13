import { useEffect, useState } from 'react'
import './App.css'
import { AuthPage } from './pages/auth/AuthPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { WarRoomPage } from './pages/board/WarRoomPage'
import { PixelBoardPage } from './pages/board/PixelBoardPage'
import { AdminPage } from './pages/admin/AdminPage'
import type { Theme } from './types/app'

const THEME_STORAGE_KEY = 'pixel-war-theme'

function getRoute(): { name: string; param?: string } {
  const path = window.location.pathname
  if (path === '/auth') return { name: 'auth' }
  if (path === '/register') return { name: 'register' }
  if (path === '/profile') return { name: 'profile' }
  if (path === '/admin') return { name: 'admin' }
  const boardMatch = /^\/board\/([^/]+)$/.exec(path)
  if (boardMatch) return { name: 'board', param: boardMatch[1] }
  return { name: 'home' }
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  })

  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setRoute(getRoute())
  }

  if (route.name === 'auth') return <AuthPage />
  if (route.name === 'register') return <RegisterPage />
  if (route.name === 'profile') return <ProfilePage theme={theme} onToggleTheme={toggleTheme} />

  if (route.name === 'admin') {
    return <AdminPage onBack={() => navigate('/')} theme={theme} onToggleTheme={toggleTheme} />
  }

  if (route.name === 'board' && route.param) {
    return (
      <PixelBoardPage
        boardId={route.param}
        onBack={() => navigate('/')}
      />
    )
  }

  return (
    <WarRoomPage
      theme={theme}
      onToggleTheme={toggleTheme}
      onOpenBoard={(id) => navigate(`/board/${id}`)}
    />
  )
}

export default App
