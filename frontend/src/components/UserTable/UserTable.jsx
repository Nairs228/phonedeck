import React, { useState, useEffect } from "react"
import axios from "axios"
import { apiUrl } from "../../api"
import Pagination from "../Pagination/Pagination" // Импортируем компонент пагинации
import "./GlobalUserTable.css" // Импортируем стили

const USERS_PER_PAGE = 5 // Количество пользователей на странице

function UserTable() {
  const [dataTable, setDataTable] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true) // Добавляем состояние загрузки
  const [error, setError] = useState("") // Добавляем состояние ошибки

  // Получаем данные при монтировании компонента
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(apiUrl("/get_data"))
        if (Array.isArray(response.data)) {
          setDataTable(response.data)
        } else {
          setError("Данные не в правильном формате")
        }
      } catch (error) {
        setError("Ошибка при загрузке данных")
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false) // Завершаем загрузку
      }
    }

    fetchData()
  }, [])

  // Пагинация
  const totalPages = Math.ceil(dataTable.length / USERS_PER_PAGE)

  // Получаем пользователей для текущей страницы
  const getCurrentUsers = () => {
    const start = (currentPage - 1) * USERS_PER_PAGE
    return dataTable.slice(start, start + USERS_PER_PAGE)
  }

  if (loading) {
    return <div>Загрузка...</div> // Показываем индикатор загрузки
  }

  if (error) {
    return <div>{error}</div> // Показываем ошибку, если она есть
  }

  return (
    <div className="container">
      <h2 className="table-h2">Список пользователей</h2>
      <p className="table-p">Последние 2 недели</p>
      <div className="row">
        <div className="col">
          <table id="user-table" className="table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Пользователь</th>
                <th>Марка</th>
                <th>Заряд</th>
                <th>Время подключения</th>
                <th>Время отключения</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentUsers().map((user, index) => (
                <tr
                  key={user.id}
                  className={index % 2 === 0 ? "light-row" : "dark-row"}
                >
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.model}</td>
                  <td>{user.charge}</td>
                  <td>{user.connection_time}</td>
                  <td>{user.disconnection_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  )
}

export default UserTable
