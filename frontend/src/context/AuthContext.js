import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import axios from "axios"
import {
  apiUrl,
  AUTH_TOKEN_KEY,
  authHeaders,
  getStoredAuthToken,
} from "../api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const persistToken = useCallback((token) => {
    if (token) {
      window.localStorage.setItem(AUTH_TOKEN_KEY, token)
    } else {
      window.localStorage.removeItem(AUTH_TOKEN_KEY)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getStoredAuthToken()
    if (!token) {
      setUser(null)
      setReady(true)
      return null
    }
    try {
      const { data } = await axios.get(apiUrl("/api/me"), {
        headers: authHeaders(),
      })
      setUser(data.user)
      return data.user
    } catch {
      persistToken(null)
      setUser(null)
      return null
    } finally {
      setReady(true)
    }
  }, [persistToken])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(
    async (username, password) => {
      const { data } = await axios.post(apiUrl("/api/login"), {
        username,
        password,
      })
      persistToken(data.token)
      setUser(data.user)
      return data.user
    },
    [persistToken],
  )

  const register = useCallback(
    async (payload) => {
      const { data } = await axios.post(apiUrl("/api/register"), payload)
      persistToken(data.token)
      setUser(data.user)
      return data.user
    },
    [persistToken],
  )

  const logout = useCallback(() => {
    persistToken(null)
    setUser(null)
  }, [persistToken])

  const updateProfile = useCallback(
    async (payload) => {
      const { data } = await axios.patch(apiUrl("/api/me"), payload, {
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      })
      if (data.token) {
        persistToken(data.token)
      }
      setUser(data.user)
      return data.user
    },
    [persistToken],
  )

  const value = useMemo(
    () => ({
      user,
      ready,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [user, ready, login, register, logout, refreshUser, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
