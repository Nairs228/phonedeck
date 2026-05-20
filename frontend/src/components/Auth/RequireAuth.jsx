import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

function RequireAuth({ children }) {
  const { user, ready } = useAuth()
  if (!ready) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>Загрузка…</div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default RequireAuth
