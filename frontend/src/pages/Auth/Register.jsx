import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import "./AuthPages.css"

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [patronymic, setPatronymic] = useState("")
  const [phoneModel, setPhoneModel] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (password !== password2) {
      setError("Пароли не совпадают")
      return
    }
    setLoading(true)
    try {
      await register({
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        patronymic: patronymic.trim(),
        phone_model: phoneModel.trim(),
        username: username.trim(),
        password,
      })
      navigate("/viewPage", { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Не удалось зарегистрироваться."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1>Регистрация</h1>
        <p className="auth-sub">
          Укажите ФИО, модель телефона, логин и пароль
        </p>
        {error ? <div className="auth-error">{error}</div> : null}
        <form onSubmit={onSubmit}>
          <div className="auth-field">
            <label htmlFor="reg-last">Фамилия</label>
            <input
              id="reg-last"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-first">Имя</label>
            <input
              id="reg-first"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-patronymic">Отчество</label>
            <input
              id="reg-patronymic"
              value={patronymic}
              onChange={(e) => setPatronymic(e.target.value)}
              autoComplete="additional-name"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-phone-model">Модель телефона</label>
            <input
              id="reg-phone-model"
              value={phoneModel}
              onChange={(e) => setPhoneModel(e.target.value)}
              placeholder="Например, Samsung Galaxy A54"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-username">Логин</label>
            <input
              id="reg-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-password">Пароль</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="reg-password2">Повтор пароля</label>
            <input
              id="reg-password2"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>
          <div className="auth-actions">
            <button className="auth-primary" type="submit" disabled={loading}>
              {loading ? "Регистрация…" : "Создать аккаунт"}
            </button>
            <p className="auth-link-row">
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
