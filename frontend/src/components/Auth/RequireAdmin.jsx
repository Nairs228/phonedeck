import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

function isAdminUser(user) {
  return Boolean(user?.is_admin)
}

function RequireAdmin({ children }) {
  const { user, ready } = useAuth()
  if (!ready) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>Загрузка…</div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!isAdminUser(user)) {
    return <Navigate to="/viewPage" replace />
  }
  return children
}

export default RequireAdmin
