import React, { useEffect, useState } from 'react'
import useSound from 'use-sound'
import soundClickForButtons from '../../../assets/mp3/soundClickForButtons.mp3'
import { useNavigate, useParams } from 'react-router-dom'
import TableForClasses from './TableForClasses'
import styles from './RatingForClass.module.css'
import Pagination from '../../../components/Pagination/Pagination'

const USERS_PER_PAGE = 10 // Установлено 10 пользователей на странице

const RatingForClass = () => {
  const [click] = useSound(soundClickForButtons)
  const { classId } = useParams() // Получаем ID класса
  const navigate = useNavigate() // Используем navigate для перехода
  const [dataTable, setDataTable] = useState([]) // Данные таблицы
  const [currentPage, setCurrentPage] = useState(1) // Текущая страница

  // Функция для получения данных пользователей
  const fetchUsers = async () => {
    const users = Array.from({ length: 220 }, (_, index) => ({
      id: index + 1,
      name: `Пользователь ${index + 1}`,
      bonusPoints: Math.floor(Math.random() * 100), // Случайные бонусные очки
      hoursInStation: Math.floor(Math.random() * 100), // Случайные часы в станции
      classId: Math.ceil(Math.random() * 11), // Присваиваем случайный класс от 1 до 11
    }))

    // Создаем массив для каждого класса
    const userMap = Array.from({ length: 11 }, () => [])

    // Группируем пользователей по классам
    users.forEach((user) => userMap[user.classId - 1].push(user))

    // Берем первых 20 пользователей для текущего класса
    const filteredUsers = userMap[parseInt(classId) - 1]

    // Устанавливаем таблицу пользователей
    setDataTable(filteredUsers.slice(0, 20)) // Установка только первых 20 пользователей
  }

  useEffect(() => {
    fetchUsers() // Получаем пользователей при монтировании компонента
  }, [classId])

  // Сортировка пользователей по бонусам
  const sortedUsers = [...dataTable].sort(
    (a, b) => b.bonusPoints - a.bonusPoints
  )
  const totalPages = Math.ceil(sortedUsers.length / USERS_PER_PAGE) // Общее количество страниц

  const getCurrentUsers = () => {
    const start = (currentPage - 1) * USERS_PER_PAGE // Начало индекса в зависимости от текущей страницы
    return sortedUsers.slice(start, start + USERS_PER_PAGE) // Возвращаем текущую страницу пользователей
  }

  return (
    <div className={styles.container}>
      <div className={styles.blockRating}>
        <h2>Рейтинг для класса {classId}</h2>
        <button
          className={styles.buttonRatting}
          onClick={() => {
            navigate('/rating/classes')
            click()
          }}
        >
          Вернуться к выбору класса
        </button>
      </div>
      <div className={styles.tableContainer}>
        {dataTable.length > 0 ? (
          <>
            <TableForClasses
              users={getCurrentUsers()}
              currentPage={currentPage}
            />
            <Pagination
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <p>Данные о пользователях для класса {classId} отсутствуют.</p>
        )}
      </div>
    </div>
  )
}

export default RatingForClass
