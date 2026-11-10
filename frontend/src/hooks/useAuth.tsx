import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, Token } from '../types/api'
import { authApi } from '../lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    const handleExpiredSession = () => {
      setToken(null)
      setUser(null)
    }
    window.addEventListener('auth:expired', handleExpiredSession)
    return () => window.removeEventListener('auth:expired', handleExpiredSession)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    const { access_token, refresh_token } = response.data.tokens
    localStorage.setItem('access_token', access_token)
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
    setToken(access_token)
    // Fetch user profile - we'll decode from token or fetch from API
    // For now, store basic info
    const userData: User = {
      ...response.data.user,
      role: response.data.user.is_admin ? 'admin' : 'user',
      updated_at: response.data.user.created_at,
    }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const register = async (email: string, password: string, fullName: string) => {
    const response = await authApi.register({ email, password, full_name: fullName })
    const { access_token, refresh_token } = response.data.tokens
    localStorage.setItem('access_token', access_token)
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
    setToken(access_token)
    const userData: User = {
      ...response.data.user,
      role: response.data.user.is_admin ? 'admin' : 'user',
      updated_at: response.data.user.created_at,
    }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
