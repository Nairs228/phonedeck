import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./AuthPages.css"

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate("/viewPage", { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Не удалось войти. Проверьте данные."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Вход</h1>
        <p className="auth-sub">Войдите по логину и паролю</p>
        {error ? <div className="auth-error">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="login-username">Логин</label>
            <input
              id="login-username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">Пароль</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="auth-actions">
            <button className="auth-primary" type="submit" disabled={loading}>
              {loading ? "Вход…" : "Войти"}
            </button>
            <p className="auth-link-row">
              Нет аккаунта? <Link to="/register">Регистрация</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
