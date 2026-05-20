import React, { useEffect, useState } from "react"
import { useAuth } from "../../context/AuthContext"
import styles from "./Profile.module.css"

function Profile() {
  const { user, updateProfile } = useAuth()
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [patronymic, setPatronymic] = useState("")
  const [phoneModel, setPhoneModel] = useState("")
  const [username, setUsername] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPassword2, setNewPassword2] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLastName(user.last_name || "")
    setFirstName(user.first_name || "")
    setPatronymic(user.patronymic || "")
    setPhoneModel(user.phone_model || "")
    setUsername(user.username || "")
    setCurrentPassword("")
    setNewPassword("")
    setNewPassword2("")
  }, [user])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (newPassword || newPassword2) {
      if (newPassword !== newPassword2) {
        setError("Новые пароли не совпадают")
        return
      }
      if (!currentPassword) {
        setError("Укажите текущий пароль для смены пароля")
        return
      }
    }
    setLoading(true)
    try {
      const payload = {
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        patronymic: patronymic.trim(),
        phone_model: phoneModel.trim(),
        username: username.trim(),
      }
      if (newPassword) {
        payload.current_password = currentPassword
        payload.new_password = newPassword
      }
      await updateProfile(payload)
      setSuccess("Данные сохранены")
      setCurrentPassword("")
      setNewPassword("")
      setNewPassword2("")
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Не удалось сохранить изменения."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Личный кабинет</h1>
      <p className={styles.sub}>Измените свои данные и при необходимости пароль</p>
      <div className={styles.card}>
        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}
        <form onSubmit={onSubmit}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Профиль</h2>
            <div className={styles.field}>
              <label htmlFor="profile-last">Фамилия</label>
              <input
                id="profile-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-first">Имя</label>
              <input
                id="profile-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-patronymic">Отчество</label>
              <input
                id="profile-patronymic"
                value={patronymic}
                onChange={(e) => setPatronymic(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-phone-model">Модель телефона</label>
              <input
                id="profile-phone-model"
                value={phoneModel}
                onChange={(e) => setPhoneModel(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-username">Логин</label>
              <input
                id="profile-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Смена пароля</h2>
            <p className={styles.hint}>
              Оставьте поля нового пароля пустыми, если менять пароль не нужно.
            </p>
            <div className={styles.field}>
              <label htmlFor="profile-current-pw">Текущий пароль</label>
              <input
                id="profile-current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-new-pw">Новый пароль</label>
              <input
                id="profile-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="profile-new-pw2">Повтор нового пароля</label>
              <input
                id="profile-new-pw2"
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                autoComplete="new-password"
                minLength={6}
              />
            </div>
          </div>
          <button className={styles.primary} type="submit" disabled={loading}>
            {loading ? "Сохранение…" : "Сохранить"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
