import React, { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { apiUrl, authHeaders } from "../../api"
import { useAuth } from "../../context/AuthContext"
import styles from "./Admin.module.css"

function isBuiltinAdmin(u) {
  return String(u?.username || "").toLowerCase() === "admin"
}

function Admin() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [databases, setDatabases] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setError("")
    setLoading(true)
    try {
      const [usersRes, healthRes] = await Promise.all([
        axios.get(apiUrl("/api/admin/users"), { headers: authHeaders() }),
        axios.get(apiUrl("/api/admin/health/databases"), {
          headers: authHeaders(),
        }),
      ])
      setUsers(usersRes.data.users || [])
      setDatabases(healthRes.data.databases || [])
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Не удалось загрузить данные админ-панели."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setUserInList = useCallback((updated) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
    )
  }, [])

  const toggleAdminRole = useCallback(
    async (u) => {
      setError("")
      setBusyId(u.id)
      try {
        const { data } = await axios.patch(
          apiUrl(`/api/admin/users/${u.id}/role`),
          { is_admin: !u.is_admin },
          { headers: { ...authHeaders(), "Content-Type": "application/json" } },
        )
        setUserInList(data.user)
      } catch (err) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "Не удалось изменить права."
        setError(msg)
      } finally {
        setBusyId(null)
      }
    },
    [setUserInList],
  )

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Администрирование</h1>
      <p className={styles.sub}>
        Список пользователей, назначение прав администратора и проверка баз данных.
        Учётная запись <strong>admin</strong> создаётся при запуске сервера с паролем по
        умолчанию из настроек бэкенда и не может быть удалена или лишена прав.
      </p>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.block}>
        <h2 className={styles.blockTitle}>Пользователи</h2>
        {loading ? (
          <p>Загрузка…</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Логин</th>
                  <th>ФИО</th>
                  <th>Модель телефона</th>
                  <th>Роль</th>
                  <th>Права</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>
                      {u.username}
                      {currentUser?.id === u.id ? (
                        <span className={styles.builtinHint}> (вы)</span>
                      ) : null}
                    </td>
                    <td>
                      {[u.last_name, u.first_name, u.patronymic]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td>{u.phone_model}</td>
                    <td>
                      {u.is_admin ? (
                        <span className={`${styles.badge} ${styles.badgeAdmin}`}>
                          Админ
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeUser}`}>
                          Пользователь
                        </span>
                      )}
                    </td>
                    <td className={styles.actions}>
                      {isBuiltinAdmin(u) && u.is_admin ? (
                        <span className={styles.builtinHint}>Встроенная УЗ</span>
                      ) : u.is_admin ? (
                        <button
                          type="button"
                          className={styles.btn}
                          disabled={busyId === u.id}
                          onClick={() => toggleAdminRole(u)}
                        >
                          {busyId === u.id ? "…" : "Снять права админа"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          disabled={busyId === u.id}
                          onClick={() => toggleAdminRole(u)}
                        >
                          {busyId === u.id ? "…" : "Сделать админом"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className={styles.block}>
        <h2 className={styles.blockTitle}>Базы данных</h2>
        {loading ? (
          <p>Загрузка…</p>
        ) : (
          <div className={styles.healthGrid}>
            {databases.map((db) => (
              <div key={db.id} className={styles.healthCard}>
                <h3>{db.id === "users" ? "Пользователи (users.db)" : "Устройства (devices.db)"}</h3>
                <p className={db.ok ? styles.healthOk : styles.healthBad}>
                  {db.ok ? "Работоспособна" : "Ошибка"}
                </p>
                <p className={styles.meta}>{db.message}</p>
                {typeof db.row_count === "number" ? (
                  <p className={styles.meta}>Записей в основной таблице: {db.row_count}</p>
                ) : null}
                <p className={styles.meta}>{db.path}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
