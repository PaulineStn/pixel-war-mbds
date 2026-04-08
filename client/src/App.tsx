import { useEffect, useState } from 'react'
import './App.css'
import { AuthPage } from './pages/auth/AuthPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { WarRoomPage } from './pages/board/WarRoomPage'
import type { Theme } from './types/app'

const THEME_STORAGE_KEY = 'pixel-war-theme'

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }

    return 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  if (window.location.pathname === '/auth') {
    return <AuthPage />
  }

  if (window.location.pathname === '/register') {
    return <RegisterPage />
  }

  if (window.location.pathname === '/profile') {
    return <ProfilePage theme={theme} onToggleTheme={toggleTheme} />
  }

  return <WarRoomPage theme={theme} onToggleTheme={toggleTheme} />
}

export default App
