import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Emails from './pages/Emails'
import Platforms from './pages/Platforms'
import { useEffect, useState } from 'react'
import type { AuthCheckResponse } from '@/types/api'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check', {
        credentials: 'include',
      })
      const data: AuthCheckResponse = await response.json()
      setIsAuthenticated(data.authenticated)
    } catch {
      setIsAuthenticated(false)
    }
  }

  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  return (
    <BrowserRouter>
      <div className="texture" />
      <Toaster />
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/emails"
          element={
            isAuthenticated ? <Emails /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/platforms"
          element={
            isAuthenticated ? <Platforms /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
