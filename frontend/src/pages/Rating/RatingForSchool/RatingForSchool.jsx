import React, { useEffect, useState } from 'react'
import Pagination from '../../../components/Pagination/Pagination'
import axios from 'axios'
import oneSt from '../../../assets/svgs/forPages/1st.svg'
import twoSt from '../../../assets/svgs/forPages/2nd.svg'
import threeSt from '../../../assets/svgs/forPages/3st.svg'
import styles from './RatingForSchool.module.css'

const USERS_PER_PAGE = 12 // Number of users per page

function RatingForSchool() {
  const [dataTable, setDataTable] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await axios.get(
        'https://jsonplaceholder.typicode.com/users'
      )
      const users = response.data.map(() => ({
        name: `Пользователь Ю.Ю.`,
        responsiblePersons: ['Строков И.И', 'Малыхина И.И'],
        phoneNumber: `+7 (999) 000-00-00`,
        bonusPoints: Math.floor(Math.random() * 100),
        hoursInStation: Math.floor(Math.random() * 100),
      }))

      const extendedUsers = []
      for (let i = 0; i < 3; i++) {
        users.forEach((user) => {
          extendedUsers.push({
            name: user.name,
            responsiblePersons: user.responsiblePersons,
            phoneNumber: user.phoneNumber,
            bonusPoints: user.bonusPoints,
            hoursInStation: user.hoursInStation,
          })
        })
      }

      setDataTable(extendedUsers.slice(0, 36))
    }

    fetchUsers()
  }, [])

  const sortedUsers = [...dataTable].sort(
    (a, b) => b.bonusPoints - a.bonusPoints
  )

  // Pagination
  const totalUsers = sortedUsers.length // Total number of users
  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE) // Calculate total pages

  // Get users for the current page
  const getCurrentUsers = () => {
    const start = (currentPage - 1) * USERS_PER_PAGE
    return sortedUsers.slice(start, start + USERS_PER_PAGE)
  }
  return (
    <div>
      <div className="row">
        <div className="col">
          <table id="user-table" className="table">
            <thead>
              <tr>
                <th>Место</th>
                <th>ФИО</th>
                <th>Кол-во бонусов</th>
                <th>Кол-во часов в станции</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentUsers().map((user, index) => {
                // Calculate the rank based on current page
                const rank = (currentPage - 1) * USERS_PER_PAGE + index + 1
                return (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'light-row' : 'dark-row'}
                  >
                    <td>
                      {rank === 1 && (
                        <img
                          src={oneSt}
                          alt="Gold Medal"
                          className={styles.medal}
                        />
                      )}
                      {rank === 2 && (
                        <img
                          src={twoSt}
                          alt="Silver Medal"
                          className={styles.medal}
                        />
                      )}
                      {rank === 3 && (
                        <img
                          src={threeSt}
                          alt="Bronze Medal"
                          className={styles.medal}
                        />
                      )}
                      {rank > 3 && <span>{rank}</span>}{' '}
                    </td>
                    <td>{user.name}</td>
                    <td>{user.bonusPoints}</td>
                    <td>{user.hoursInStation}</td>
                  </tr>
                )
              })}
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

export default RatingForSchool
