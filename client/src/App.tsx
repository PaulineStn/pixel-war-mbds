import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import { AuthPage } from './pages/auth/AuthPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { WarRoomPage } from './pages/board/WarRoomPage'
import { PixelBoardPage } from './pages/board/PixelBoardPage'
import { AdminPage } from './pages/admin/AdminPage'
import { NotFoundPage } from './pages/NotFoundPage'
import type { Theme } from './types/app'

const THEME_STORAGE_KEY = 'pixel-war-theme'

function AppRoutes() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  const navigate = useNavigate()

  return (
    <Routes>
      <Route path="/" element={
        <WarRoomPage theme={theme} onToggleTheme={toggleTheme} onOpenBoard={(id) => navigate(`/board/${id}`)} />
      } />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={
        <ProfilePage theme={theme} onToggleTheme={toggleTheme} />
      } />
      <Route path="/admin" element={
        <AdminPage onBack={() => navigate('/')} theme={theme} onToggleTheme={toggleTheme} />
      } />
      <Route path="/board/:id" element={
        <BoardRouteWrapper />
      } />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

import { useParams } from 'react-router-dom'
function BoardRouteWrapper() {
  const { id } = useParams()
  const navigate = useNavigate()
  if (!id) return null
  return <PixelBoardPage boardId={id} onBack={() => navigate('/')} />
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
